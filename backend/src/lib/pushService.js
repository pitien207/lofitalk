import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

// Web Push (browser notifications while LofiTalk is closed). Enabled only when
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT are set; otherwise every
// function here is a no-op and the web app hides the setting.
// Generate keys once with: npx web-push generate-vapid-keys

export const MAX_SUBSCRIPTIONS_PER_USER = 5;
const PUSH_TTL_SECONDS = 24 * 60 * 60;
const MAX_BODY_LENGTH = 140;

let configured = null;

const configure = () => {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    configured = false;
    return configured;
  }
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch (error) {
    console.error("Web Push disabled: invalid VAPID settings:", error.message);
    configured = false;
  }
  return configured;
};

export const isPushEnabled = () => configure();
export const getVapidPublicKey = () => (configure() ? process.env.VAPID_PUBLIC_KEY : null);

// Replaced in tests so no real push service is contacted.
let sendNotification = (subscription, payload, options) =>
  webpush.sendNotification(subscription, payload, options);
export const setPushSenderForTests = (fn) => {
  sendNotification = fn;
  configured = null;
};

export const savePushSubscription = async (userId, { endpoint, keys }, userAgent = "") => {
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      $set: {
        user: userId,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: userAgent.slice(0, 300),
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // Keep only the newest few browsers per user.
  const stale = await PushSubscription.find({ user: userId })
    .sort({ updatedAt: -1 })
    .skip(MAX_SUBSCRIPTIONS_PER_USER)
    .select("_id")
    .lean();
  if (stale.length) {
    await PushSubscription.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
  }
};

export const removePushSubscription = (userId, endpoint) =>
  PushSubscription.deleteOne({ user: userId, endpoint });

export const removeAllPushSubscriptions = (userId) =>
  PushSubscription.deleteMany({ user: userId });

// Sends to every browser of the user; subscriptions the push service reports as
// gone (404/410) are deleted. Never throws.
export const sendPushToUser = async (userId, payload) => {
  if (!configure() || !userId) return 0;
  let delivered = 0;
  try {
    const subscriptions = await PushSubscription.find({ user: userId }).lean();
    const body = JSON.stringify(payload);
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            body,
            { TTL: PUSH_TTL_SECONDS, urgency: "high", topic: payload.topic }
          );
          delivered += 1;
        } catch (error) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error("Web Push send failed:", error?.statusCode || error?.message);
          }
        }
      })
    );
  } catch (error) {
    console.error("Web Push error:", error.message);
  }
  return delivered;
};

const truncate = (value, max) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

// New chat message for someone who has LofiTalk closed.
export const sendChatMessagePush = ({ recipientId, senderId, senderName, text, threadId }) =>
  sendPushToUser(recipientId, {
    type: "chat",
    title: senderName || "LofiTalk",
    body: truncate(String(text || ""), MAX_BODY_LENGTH),
    url: `/chat/${senderId}`,
    // Push "topic" collapses undelivered messages of one thread (max 32 URL-safe chars).
    topic: `c${String(threadId).slice(-24)}`,
    tag: `chat-${threadId}`,
  });
