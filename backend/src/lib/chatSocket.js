import { Server as SocketIOServer } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { getChatConversationModel } from "../models/ChatConversation.js";
import {
  buildThreadSummary,
  ensureConversation,
  formatMessage,
  loadUserMap,
  markConversationRead,
  saveChatMessage,
} from "./chatService.js";

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

export const setupChatSocket = (httpServer, allowedOrigins = []) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getAuthToken(socket);
      if (!token) {
        return next(new Error("Missing auth token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (!decoded?.userId) {
        return next(new Error("Invalid token"));
      }

      const user = await User.findById(decoded.userId).select(
        "_id fullName profilePic isOnline lastActiveAt"
      );

      if (!user) {
        return next(new Error("User not found"));
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
    socket.emit("chat:ready", { userId });

    socket.on("chat:join", ({ threadId }) => {
      if (threadId) {
        socket.join(toRoomName(threadId));
      }
    });

    socket.on("chat:send-message", async (payload = {}, callback = () => {}) => {
      try {
        const { text, toUserId, threadId, tempId } = payload;
        const normalizedText = text?.toString().trim();

        if (!normalizedText) {
          return callback({ error: "Message text is required" });
        }

        const Conversation = getChatConversationModel();
        let conversation = null;

        if (threadId) {
          conversation = await Conversation.findById(threadId);
        } else if (toUserId) {
          conversation = await ensureConversation(userId, toUserId);
        }

        if (!conversation) {
          return callback({ error: "Conversation not found" });
        }

        const recipientId =
          toUserId ||
          conversation.participants.find(
            (participant) => participant.toString() !== userId
          );

        if (!recipientId) {
          return callback({ error: "Recipient not found" });
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

    socket.on("disconnect", async () => {
      try {
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
