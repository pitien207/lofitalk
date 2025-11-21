import mongoose from "mongoose";
import User from "../models/User.js";
import { getChatConversationModel } from "../models/ChatConversation.js";
import { getChatMessageModel } from "../models/ChatMessage.js";

const ONLINE_THRESHOLD_MS =
  parseInt(process.env.USER_ONLINE_MINUTES || "5", 10) * 60 * 1000;

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(value);

const buildRoomKey = (userId, peerId) =>
  [userId.toString(), peerId.toString()].sort().join(":");

const normalizePresence = (userDoc) => {
  if (!userDoc) return null;
  const base = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  const lastActiveAt = base.lastActiveAt ? new Date(base.lastActiveAt) : null;
  const isFresh =
    base.isOnline &&
    lastActiveAt &&
    Date.now() - lastActiveAt.getTime() <= ONLINE_THRESHOLD_MS;

  return {
    _id: base._id?.toString(),
    fullName: base.fullName || "",
    profilePic: base.profilePic || "",
    lastActiveAt: base.lastActiveAt || null,
    isOnline: Boolean(isFresh),
  };
};

export const ensureConversation = async (userId, peerId) => {
  const Conversation = getChatConversationModel();
  const roomKey = buildRoomKey(userId, peerId);

  let conversation = await Conversation.findOne({ roomKey });

  if (!conversation) {
    const participants = [toObjectId(userId), toObjectId(peerId)].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

    conversation = await Conversation.create({
      roomKey,
      participants,
      unreadByUser: {
        [participants[0].toString()]: 0,
        [participants[1].toString()]: 0,
      },
    });
  }

  return conversation;
};

export const saveChatMessage = async ({
  conversation,
  senderId,
  recipientId,
  text,
}) => {
  const Message = getChatMessageModel();
  const senderIdStr = senderId.toString();
  const recipientIdStr = recipientId.toString();

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    recipient: recipientId,
    text,
    readBy: [senderId],
  });

  conversation.lastMessageText = text.slice(0, 500);
  conversation.lastMessageAt = message.createdAt;
  conversation.lastSender = senderId;

  if (!conversation.unreadByUser) {
    conversation.unreadByUser = new Map();
  }

  if (typeof conversation.unreadByUser.set === "function") {
    conversation.unreadByUser.set(senderIdStr, 0);
    const currentUnread = conversation.unreadByUser.get(recipientIdStr) || 0;
    conversation.unreadByUser.set(recipientIdStr, currentUnread + 1);
  } else {
    conversation.unreadByUser = {
      ...conversation.unreadByUser,
      [senderIdStr]: 0,
      [recipientIdStr]:
        (conversation.unreadByUser?.[recipientIdStr] || 0) + 1,
    };
  }

  conversation.markModified("unreadByUser");
  await conversation.save();

  return message;
};

export const fetchRecentMessages = async (conversationId, limit = 50) => {
  const Message = getChatMessageModel();
  return Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const markConversationRead = async (conversationId, userId) => {
  const Conversation = getChatConversationModel();
  const Message = getChatMessageModel();
  const userIdStr = userId.toString();

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  if (conversation.unreadByUser?.set) {
    conversation.unreadByUser.set(userIdStr, 0);
  } else {
    conversation.unreadByUser = {
      ...conversation.unreadByUser,
      [userIdStr]: 0,
    };
  }

  conversation.markModified("unreadByUser");
  await conversation.save();

  await Message.updateMany(
    { conversation: conversationId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  return conversation;
};

export const loadUserMap = async (userIds = []) => {
  const ids = Array.from(
    new Set(userIds.map((id) => id && id.toString()).filter(Boolean))
  );
  if (!ids.length) return {};

  const users = await User.find({ _id: { $in: ids } }).select(
    "fullName profilePic lastActiveAt isOnline"
  );

  return users.reduce((acc, user) => {
    acc[user._id.toString()] = normalizePresence(user);
    return acc;
  }, {});
};

export const formatMessage = (message) => {
  if (!message) return null;
  return {
    id: message._id?.toString(),
    conversationId: message.conversation?.toString(),
    senderId: message.sender?.toString(),
    recipientId: message.recipient?.toString(),
    text: message.text,
    createdAt: message.createdAt,
    readBy: (message.readBy || []).map((id) => id.toString()),
  };
};

export const buildThreadSummary = (conversation, viewerId, userMap = {}) => {
  if (!conversation) return null;

  const viewerIdStr = viewerId.toString();
  const participantIds = (conversation.participants || []).map((p) =>
    p.toString()
  );
  const partnerId = participantIds.find((id) => id !== viewerIdStr) || null;

  const unreadCount =
    (conversation.unreadByUser?.get?.(viewerIdStr) ??
      conversation.unreadByUser?.[viewerIdStr]) ||
    0;

  return {
    id: conversation._id?.toString(),
    partnerId,
    partner: partnerId ? userMap[partnerId] : null,
    lastMessage: conversation.lastMessageText || "",
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    lastSender: conversation.lastSender?.toString() || null,
    unreadCount,
  };
};
