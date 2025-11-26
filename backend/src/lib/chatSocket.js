import { Server as SocketIOServer } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { getChatConversationModel } from "../models/ChatConversation.js";
import {
  MAX_MESSAGE_LENGTH,
  buildThreadSummary,
  ensureConversation,
  formatMessage,
  loadUserMap,
  markConversationRead,
  saveChatMessage,
} from "./chatService.js";

const MATCHMIND_INVITE_TTL_MS = parseInt(
  process.env.MATCHMIND_INVITE_TTL_MS || "30000",
  10
);
const MATCHMIND_CANCEL_TTL_MS = 60000;

const matchMindInvites = new Map();

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
const buildInviteId = () =>
  `mm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const scheduleInviteCleanup = (inviteId, delayMs = MATCHMIND_CANCEL_TTL_MS) => {
  setTimeout(() => {
    if (matchMindInvites.get(inviteId)?.status === "canceled") {
      matchMindInvites.delete(inviteId);
    }
  }, delayMs);
};

const scheduleInviteExpiry = (io, inviteId) => {
  setTimeout(() => {
    const invite = matchMindInvites.get(inviteId);
    if (!invite) return;
    if (invite.expiresAt <= Date.now() && invite.status === "pending") {
      matchMindInvites.delete(inviteId);
      io.to(toUserRoom(invite.hostId)).emit("matchmind:response", {
        inviteId,
        accepted: false,
        reason: "expired",
      });
      io.to(toUserRoom(invite.guestId)).emit("matchmind:expired", { inviteId });
    }
  }, MATCHMIND_INVITE_TTL_MS + 500);
};

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
        if (normalizedText.length > MAX_MESSAGE_LENGTH) {
          return callback({
            error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
          });
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

    socket.on("matchmind:invite", async ({ toUserId } = {}, callback = () => {}) => {
      try {
        if (!toUserId) return callback({ error: "toUserId is required" });
        if (toUserId === userId) return callback({ error: "Cannot invite yourself" });

        const inviteId = buildInviteId();
        const expiresAt = Date.now() + MATCHMIND_INVITE_TTL_MS;

        const invite = {
          inviteId,
          hostId: userId,
          hostName: user.fullName,
          hostPic: user.profilePic,
          guestId: toUserId,
          status: "pending",
          expiresAt,
        };

        matchMindInvites.set(inviteId, invite);
        scheduleInviteExpiry(io, inviteId);

        io.to(toUserRoom(toUserId)).emit("matchmind:invite", {
          inviteId,
          expiresAt,
          fromUser: {
            id: userId,
            fullName: user.fullName,
            profilePic: user.profilePic,
          },
        });

        return callback({ ok: true, inviteId, expiresAt });
      } catch (error) {
        console.error("Error in matchmind:invite", error);
        return callback({ error: "Unable to send invite" });
      }
    });

    socket.on("matchmind:cancel", ({ inviteId } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? matchMindInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.hostId !== userId) return callback({ error: "Only host can cancel" });
        if (invite.status !== "pending" && invite.status !== "accepted") {
          return callback({ error: "Cannot cancel at this stage" });
        }

        invite.status = "canceled";
        invite.canceledAt = Date.now();
        matchMindInvites.set(inviteId, invite);
        scheduleInviteCleanup(inviteId);

        io.to(toUserRoom(invite.guestId)).emit("matchmind:cancelled", {
          inviteId,
          hostId: invite.hostId,
          hostName: invite.hostName,
        });

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in matchmind:cancel", error);
        return callback({ error: "Unable to cancel invite" });
      }
    });

    socket.on(
      "matchmind:respond",
      async ({ inviteId, accepted } = {}, callback = () => {}) => {
        try {
          const invite = inviteId ? matchMindInvites.get(inviteId) : null;
          if (!invite) return callback({ error: "Invite not found or expired" });
          if (invite.status === "canceled") {
            return callback({ error: "Invite was canceled by the host" });
          }
          if (invite.guestId !== userId)
            return callback({ error: "You are not the recipient of this invite" });
          if (invite.expiresAt <= Date.now()) {
            matchMindInvites.delete(inviteId);
            io.to(toUserRoom(invite.hostId)).emit("matchmind:response", {
              inviteId,
              accepted: false,
              reason: "expired",
            });
            return callback({ error: "Invite expired" });
          }

          invite.status = accepted ? "accepted" : "declined";
          invite.guestName = user.fullName;
          invite.guestPic = user.profilePic;
          matchMindInvites.set(inviteId, invite);

          io.to(toUserRoom(invite.hostId)).emit("matchmind:response", {
            inviteId,
            accepted: Boolean(accepted),
            guestId: userId,
            guestName: user.fullName,
            guestPic: user.profilePic,
          });

          if (!accepted) {
            matchMindInvites.delete(inviteId);
          }

          return callback({ ok: true });
        } catch (error) {
          console.error("Error in matchmind:respond", error);
          return callback({ error: "Unable to respond to invite" });
        }
      }
    );

    socket.on("matchmind:start", ({ inviteId } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? matchMindInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.hostId !== userId)
          return callback({ error: "Only the host can start the game" });
        if (invite.status !== "accepted")
          return callback({ error: "Invite not accepted yet" });

        invite.status = "started";
        matchMindInvites.set(inviteId, invite);

        io.to(toUserRoom(invite.guestId)).emit("matchmind:start", {
          inviteId,
          hostId: invite.hostId,
          hostName: invite.hostName,
          hostPic: invite.hostPic,
        });

        io.to(toUserRoom(invite.hostId)).emit("matchmind:start", {
          inviteId,
          hostId: invite.hostId,
          hostName: invite.hostName,
          hostPic: invite.hostPic,
        });

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in matchmind:start", error);
        return callback({ error: "Unable to start game" });
      }
    });

    socket.on(
      "matchmind:answer",
      ({ inviteId, questionId, answer } = {}, callback = () => {}) => {
        try {
          const invite = inviteId ? matchMindInvites.get(inviteId) : null;
          if (!invite) return callback({ error: "Invite not found" });
          if (invite.status !== "started")
            return callback({ error: "Game not started for this invite" });
          const isHost = invite.hostId === userId;
          const partnerId = isHost ? invite.guestId : invite.hostId;
          if (!partnerId) return callback({ error: "Partner not found" });

          io.to(toUserRoom(partnerId)).emit("matchmind:answer", {
            inviteId,
            questionId,
            answer,
            userId,
          });

          return callback({ ok: true });
        } catch (error) {
          console.error("Error in matchmind:answer", error);
          return callback({ error: "Unable to send answer" });
        }
      }
    );

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
