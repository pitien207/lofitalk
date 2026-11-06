import { Server as SocketIOServer } from "socket.io";
import cookie from "cookie";

import User from "../models/User.js";
import {
  MAX_MESSAGE_LENGTH,
  buildThreadSummary,
  findConversationForParticipant,
  formatMessage,
  loadUserMap,
  markConversationRead,
  resolveConversationForSender,
  saveChatMessage,
} from "./chatService.js";
import { isTokenCurrent, verifyAuthToken } from "./authToken.js";
import { getActiveBan } from "./accountStatus.js";
import { messageLimiter } from "./socketRateLimiter.js";
import { loadBlockStatus } from "./blockService.js";
import { attachMatchMindHandlers } from "./matchmindSocket.js";
import { attachTruthOrLieHandlers } from "./truthOrLieSocket.js";
import { sendChatMessagePush } from "./pushService.js";

const USER_MAP_CACHE_TTL_MS = parseInt(
  process.env.CHAT_USERMAP_TTL_MS || "120000",
  10
);
const userMapCache = new Map();

const buildUserMapCacheKey = (participants = []) =>
  (participants || [])
    .map((id) => id && id.toString())
    .filter(Boolean)
    .sort()
    .join("|");

const getCachedUserMap = async (participants = []) => {
  const cacheKey = buildUserMapCacheKey(participants);
  const now = Date.now();
  const cached = userMapCache.get(cacheKey);
  if (cached && now - cached.timestamp < USER_MAP_CACHE_TTL_MS) {
    return cached.value;
  }

  const userMap = await loadUserMap(participants);
  userMapCache.set(cacheKey, { value: userMap, timestamp: now });
  return userMap;
};

const getAuthToken = (socket) => {
  const rawCookie = socket.handshake?.headers?.cookie;
  if (rawCookie) {
    const parsed = cookie.parse(rawCookie);
    if (parsed?.jwt) return parsed.jwt;
  }
  return socket.handshake?.auth?.token || null;
};

const toRoomName = (threadId) => `thread:${threadId}`;
const toUserRoom = (userId) => `user:${userId}`;

let ioInstance = null;

// Closes every realtime connection of a user (e.g. after a password reset).
export const disconnectUserSockets = (userId) => {
  if (ioInstance && userId) {
    ioInstance.in(toUserRoom(userId.toString())).disconnectSockets(true);
  }
};

// "Something changed, refetch it" hints that replace client polling. The payload
// carries only a topic; clients reload the data through the normal (authorized) API.
const ADMIN_ROOM = "admins";
export const NOTIFY_EVENT = "notify:changed";
export const NotifyTopic = Object.freeze({
  FRIEND_REQUESTS: "friendRequests",
  ADMIN_NOTIFICATIONS: "adminNotifications",
  REPORTS: "reports",
});

export const notifyUsers = (userIds = [], topic) => {
  if (!ioInstance) return;
  const rooms = [
    ...new Set(userIds.filter(Boolean).map((id) => toUserRoom(id.toString()))),
  ];
  if (rooms.length) ioInstance.to(rooms).emit(NOTIFY_EVENT, { topic });
};

export const notifyAdmins = (topic) => {
  ioInstance?.to(ADMIN_ROOM).emit(NOTIFY_EVENT, { topic });
};

// True while the user has LofiTalk open somewhere (at least one live socket).
export const isUserConnected = (userId) =>
  Boolean(userId && ioInstance?.sockets.adapter.rooms.get(toUserRoom(userId.toString()))?.size);

// Browser notification for a new message, only if the recipient has the app closed.
export const pushIfOffline = ({ recipientId, senderId, senderName, text, threadId }) => {
  if (isUserConnected(recipientId)) return;
  sendChatMessagePush({ recipientId, senderId, senderName, text, threadId }).catch(() => {});
};

export const notifyEveryone = (topic) => {
  ioInstance?.emit(NOTIFY_EVENT, { topic });
};

export const setupChatSocket = (httpServer, allowedOrigins = []) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = getAuthToken(socket);
      if (!token) {
        return next(new Error("Missing auth token"));
      }

      const decoded = verifyAuthToken(token);
      if (!decoded) {
        return next(new Error("Invalid token"));
      }

      const user = await User.findById(decoded.userId).select(
        "_id fullName profilePic isOnline lastActiveAt accountType tokenVersion bannedUntil"
      );

      if (!user) {
        return next(new Error("User not found"));
      }

      // Token issued before the last password change/reset.
      if (!isTokenCurrent(decoded, user)) {
        return next(new Error("Session expired"));
      }

      if (getActiveBan(user)) {
        return next(new Error("Account suspended"));
      }

      socket.data.user = user;

      await User.findByIdAndUpdate(user._id, {
        $set: { isOnline: true, lastActiveAt: new Date() },
      });

      return next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    const userId = user._id.toString();

    socket.join(toUserRoom(userId));
    if (user.accountType === "admin") socket.join(ADMIN_ROOM);
    socket.emit("chat:ready", { userId });

    // Only participants may subscribe to a thread's realtime events.
    socket.on("chat:join", async ({ threadId } = {}) => {
      try {
        const conversation = await findConversationForParticipant(
          threadId,
          userId,
          "participants"
        );
        if (conversation) {
          socket.join(toRoomName(conversation._id.toString()));
        }
      } catch (error) {
        console.error("Error joining chat thread:", error.message);
      }
    });

    socket.on("chat:send-message", async (payload = {}, callback = () => {}) => {
      try {
        if (!messageLimiter.allow(userId)) {
          return callback({
            error: "You are sending messages too quickly. Please slow down.",
            code: "RATE_LIMITED",
          });
        }

        const { text, toUserId, threadId, tempId } = payload;
        const normalizedText = text?.toString().trim();

        if (!normalizedText) {
          return callback({ error: "Message text is required" });
        }
        if (normalizedText.length > MAX_MESSAGE_LENGTH) {
          return callback({
            error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
          });
        }

        // The sender must belong to the thread; the recipient is derived from it.
        const destination = await resolveConversationForSender({
          senderId: userId,
          threadId,
          toUserId,
        });
        if (destination.error) {
          return callback({ error: destination.error });
        }
        const { conversation, recipientId } = destination;

        const blockStatus = await loadBlockStatus(userId, recipientId, {
          viewerSelect: "blockedUsers",
          targetSelect: "blockedUsers",
          lean: true,
        });

        if (!blockStatus.targetExists) {
          return callback({ error: "Recipient not found" });
        }

        if (blockStatus.userBlockedTarget) {
          return callback({ error: "You have blocked this user" });
        }

        if (blockStatus.targetBlockedUser) {
          return callback({ error: "You cannot message this user" });
        }

        const message = await saveChatMessage({
          conversation,
          senderId: userId,
          recipientId,
          text: normalizedText,
        });

        const userMap = await getCachedUserMap(conversation.participants);
        const formattedMessage = formatMessage(message);
        const threadRoom = toRoomName(conversation._id.toString());
        const recipientIdStr = recipientId.toString();

        socket.join(threadRoom);

        io.to(threadRoom).emit("chat:message:new", {
          message: formattedMessage,
          threadId: conversation._id.toString(),
          tempId: tempId || null,
        });

        [recipientIdStr, userId].forEach((participantId) => {
          io.to(toUserRoom(participantId)).emit(
            "chat:thread:update",
            buildThreadSummary(conversation, participantId, userMap)
          );
        });

        pushIfOffline({
          recipientId: recipientIdStr,
          senderId: userId,
          senderName: user.fullName,
          text: normalizedText,
          threadId: conversation._id.toString(),
        });

        return callback({
          ok: true,
          threadId: conversation._id.toString(),
          message: formattedMessage,
        });
      } catch (error) {
        console.error("Error in chat:send-message", error);
        return callback({ error: "Unable to send message" });
      }
    });

    socket.on("chat:mark-read", async ({ threadId }) => {
      if (!threadId) return;
      try {
        const updated = await markConversationRead(threadId, userId);
        if (!updated) return;

        const userMap = await getCachedUserMap(updated.participants);
        const summary = buildThreadSummary(updated, userId, userMap);

        io.to(toUserRoom(userId)).emit("chat:thread:update", summary);
        io.to(toRoomName(threadId)).emit("chat:read", {
          threadId,
          userId,
        });
      } catch (error) {
        console.error("Error marking conversation read via socket:", error);
      }
    });

    // Game sockets (Truth or Liar / MatchMind)
    attachMatchMindHandlers(io, socket, user, toUserRoom);
    attachTruthOrLieHandlers(io, socket, user, toUserRoom);

    socket.on("disconnect", async () => {
      try {
        // Another tab of the same user may still be connected: stay online then.
        const remainingSockets = await io.in(toUserRoom(userId)).fetchSockets();
        if (remainingSockets.length > 0) return;

        await User.findByIdAndUpdate(userId, {
          $set: { isOnline: false, lastActiveAt: new Date() },
        });
      } catch (error) {
        console.error("Error updating user presence on disconnect:", error);
      }
    });
  });

  return io;
};
