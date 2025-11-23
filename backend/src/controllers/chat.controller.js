import User from "../models/User.js";
import {
  buildThreadSummary,
  ensureConversation,
  fetchRecentMessages,
  formatMessage,
  loadUserMap,
  markConversationRead,
  saveChatMessage,
} from "../lib/chatService.js";
import { getChatConversationModel } from "../models/ChatConversation.js";

const normalizeLimit = (value, fallback = 20) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 200);
};

const normalizeCursor = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export async function getChatThreads(req, res) {
  try {
    const viewerId = req.user._id;
    const Conversation = getChatConversationModel();

    const threads = await Conversation.find({ participants: viewerId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const participantIds = threads.flatMap((thread) => thread.participants || []);
    const userMap = await loadUserMap(participantIds);

    const payload = threads.map((thread) =>
      buildThreadSummary(thread, viewerId, userMap)
    );

    res.status(200).json({ threads: payload });
  } catch (error) {
    console.error("Error fetching chat threads:", error);
    res.status(500).json({ message: "Unable to load chat threads" });
  }
}

export async function getThreadWithUser(req, res) {
  try {
    const viewerId = req.user._id;
    const { userId } = req.params;
    const limit = normalizeLimit(req.query.limit, 20);
    const before = normalizeCursor(req.query.before);
    const after = normalizeCursor(req.query.after);

    if (!userId) {
      return res.status(400).json({ message: "Target user is required" });
    }

    const targetUser = await User.findById(userId).select(
      "fullName profilePic isOnline lastActiveAt"
    );

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversation = await ensureConversation(viewerId, userId);
    const messages = await fetchRecentMessages(conversation._id, {
      limit,
      before,
      after,
    });
    const updatedConversation = await markConversationRead(
      conversation._id,
      viewerId
    );

    const userMap = await loadUserMap([
      ...(conversation.participants || []),
      viewerId,
    ]);

    const thread = buildThreadSummary(
      updatedConversation || conversation,
      viewerId,
      userMap
    );

    res.status(200).json({
      thread,
      partner: thread?.partner,
      messages: messages.map(formatMessage),
    });
  } catch (error) {
    console.error("Error fetching chat thread:", error);
    res.status(500).json({ message: "Unable to load chat thread" });
  }
}

export async function getThreadMessages(req, res) {
  try {
    const viewerId = req.user._id;
    const { threadId } = req.params;
    const limit = normalizeLimit(req.query.limit, 20);
    const before = normalizeCursor(req.query.before);
    const after = normalizeCursor(req.query.after);

    if (!threadId) {
      return res.status(400).json({ message: "Thread id is required" });
    }

    const Conversation = getChatConversationModel();
    const conversation = await Conversation.findById(threadId);

    const isParticipant = (conversation?.participants || []).some(
      (participantId) => participantId.toString() === viewerId.toString()
    );

    if (!conversation || !isParticipant) {
      return res.status(404).json({ message: "Thread not found" });
    }

    const messages = await fetchRecentMessages(threadId, {
      limit,
      before,
      after,
    });
    await markConversationRead(threadId, viewerId);

    res
      .status(200)
      .json({ messages: messages.map(formatMessage) });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Unable to load messages" });
  }
}

export async function sendMessage(req, res) {
  try {
    const senderId = req.user._id;
    const { toUserId, text, threadId } = req.body;

    const normalizedText = text?.toString().trim();
    if (!normalizedText) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const targetUserId = toUserId || null;

    if (!threadId && !targetUserId) {
      return res
        .status(400)
        .json({ message: "Destination thread or user is required" });
    }

    let conversation = null;

    if (threadId) {
      const Conversation = getChatConversationModel();
      conversation = await Conversation.findById(threadId);
    } else if (targetUserId) {
      conversation = await ensureConversation(senderId, targetUserId);
    }

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const recipientId =
      toUserId ||
      conversation.participants.find(
        (participant) => participant.toString() !== senderId.toString()
      );

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient not found" });
    }

    const message = await saveChatMessage({
      conversation,
      senderId,
      recipientId,
      text: normalizedText,
    });

    res.status(201).json({
      threadId: conversation._id.toString(),
      message: formatMessage(message),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Unable to send message" });
  }
}

export async function markThreadRead(req, res) {
  try {
    const viewerId = req.user._id;
    const { threadId } = req.params;

    if (!threadId) {
      return res.status(400).json({ message: "Thread id is required" });
    }

    const updated = await markConversationRead(threadId, viewerId);
    if (!updated) {
      return res.status(404).json({ message: "Thread not found" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking thread read:", error);
    res.status(500).json({ message: "Unable to mark as read" });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const viewerIdStr = req.user._id.toString();
    const Conversation = getChatConversationModel();

    const threads = await Conversation.find({
      participants: viewerIdStr,
    }).select("unreadByUser");

    const total = threads.reduce((sum, thread) => {
      const unread =
        (thread.unreadByUser?.get?.(viewerIdStr) ??
          thread.unreadByUser?.[viewerIdStr]) ||
        0;
      return sum + unread;
    }, 0);

    res.status(200).json({ count: total });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Unable to fetch unread count" });
  }
}
