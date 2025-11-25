import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectChatSocket,
  disconnectChatSocket,
} from "../lib/chatSocket";
import {
  fetchChatThreads,
  fetchThreadWithUser,
  fetchThreadMessages,
  markThreadRead,
  sendChatMessage,
} from "../services/chatService";

const sortThreads = (list = []) =>
  [...list].sort(
    (a, b) =>
      new Date(b.lastMessageAt || b.updatedAt || 0).getTime() -
      new Date(a.lastMessageAt || a.updatedAt || 0).getTime()
  );

const THREAD_FIELDS = [
  "_id",
  "participants",
  "lastMessageText",
  "lastMessageAt",
  "lastSender",
  "unreadByUser",
  "updatedAt",
];

const mergeThreads = (current = [], incoming = []) => {
  if (!incoming?.length) return current;
  const map = new Map();
  current.forEach((thread) => {
    if (thread?.id) {
      map.set(thread.id, thread);
    }
  });

  incoming.forEach((thread) => {
    if (!thread?.id) return;
    const existing = map.get(thread.id) || {};
    map.set(thread.id, { ...existing, ...thread, id: thread.id });
  });

  return Array.from(map.values());
};

const useChat = () => {
  const [threads, setThreads] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectingThread, setSelectingThread] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [loadingMoreThreads, setLoadingMoreThreads] = useState(false);
  const [threadsCursor, setThreadsCursor] = useState(null);

  const socketRef = useRef(null);
  const activeThreadIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const isConnectingRef = useRef(false);
  const lastThreadSyncRef = useRef(null);

  const resetChat = useCallback(() => {
    setThreads([]);
    setActiveThread(null);
    setMessages([]);
    setChatError(null);
    setHasMoreMessages(true);
    setLoadingMoreMessages(false);
    setHasMoreThreads(true);
    setThreadsCursor(null);
    setLoadingMoreThreads(false);
    activeThreadIdRef.current = null;
    lastThreadSyncRef.current = null;
  }, []);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("chat:message:new");
      socketRef.current.off("chat:thread:update");
      socketRef.current.off("connect_error");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const disconnectChat = useCallback(() => {
    cleanupSocket();
    disconnectChatSocket();
    resetChat();
    currentUserIdRef.current = null;
  }, [cleanupSocket, resetChat]);

  const upsertThread = useCallback((thread) => {
    if (!thread?.id) return;
    setThreads((prev) => {
      const filtered = prev.filter((item) => item.id !== thread.id);
      return sortThreads([thread, ...filtered]);
    });
  }, []);

  const upsertMessage = useCallback((incoming) => {
    if (!incoming) return;
    setMessages((prev) => {
      const filtered = prev.filter(
        (msg) => msg.id !== incoming.id && msg.tempId !== incoming.tempId
      );
      const next = [...filtered, incoming];
      return next.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    });
  }, []);

  const refreshThreads = useCallback(
    async ({ fullReload = false } = {}) => {
      setChatLoading(true);
      setChatError(null);
      const params = {
        limit: 20,
        fields: THREAD_FIELDS,
      };

      if (!fullReload && lastThreadSyncRef.current) {
        params.updatedAfter = lastThreadSyncRef.current;
      }

      try {
        const data = await fetchChatThreads(params);
        const list = data?.threads ?? data ?? [];
        setThreads((prev) => {
          if (fullReload || !lastThreadSyncRef.current) {
            return sortThreads(list);
          }
          const merged = mergeThreads(prev, list);
          return sortThreads(merged);
        });
        setHasMoreThreads(data?.hasMore ?? Boolean(data?.nextCursor));
        setThreadsCursor(data?.nextCursor ?? null);
        if (list.length) {
          const latest = list[0]?.lastMessageAt || list[0]?.updatedAt;
          if (latest) {
            lastThreadSyncRef.current = latest;
          }
        } else if (fullReload) {
          lastThreadSyncRef.current = null;
        }
        return list;
      } catch (error) {
        const message =
          error?.response?.data?.message || "Unable to load conversations";
        setChatError(message);
        return [];
      } finally {
        setChatLoading(false);
      }
    },
    []
  );

  const joinThreadRoom = useCallback((threadId) => {
    activeThreadIdRef.current = threadId;
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:join", { threadId });
      socketRef.current.emit("chat:mark-read", { threadId });
    } else {
      markThreadRead(threadId).catch(() => null);
    }
  }, []);

  const openThread = useCallback(
    async (targetUserId) => {
      if (!targetUserId) return;

      const resolvedUserId =
        threads.find((thread) => thread.id === targetUserId)?.partnerId ||
        targetUserId;

      if (!resolvedUserId) return;

      setSelectingThread(true);
      setChatError(null);

      try {
        const data = await fetchThreadWithUser(resolvedUserId, { limit: 20 });
        const thread = data?.thread;
        setMessages(data?.messages ?? []);
        setHasMoreMessages((data?.messages?.length || 0) >= 20);
        if (thread) {
          setActiveThread(thread);
          upsertThread(thread);
          if (thread.id) {
            joinThreadRoom(thread.id);
          }
        }
      } catch (error) {
        const message =
          error?.response?.data?.message || "Unable to open chat right now";
        setChatError(message);
      } finally {
        setSelectingThread(false);
      }
    },
    [joinThreadRoom, threads, upsertThread]
  );

  const startDirectChat = useCallback(
    async (targetUserId) => openThread(targetUserId),
    [openThread]
  );

  const closeThread = useCallback(() => {
    activeThreadIdRef.current = null;
    setActiveThread(null);
    setMessages([]);
    setHasMoreMessages(true);
    setLoadingMoreMessages(false);
  }, []);

  const handleIncomingMessage = useCallback(
    (payload = {}) => {
      const message = payload.message;
      const thread = payload.thread;

      if (thread) {
        upsertThread(thread);
      }

      const threadId =
        thread?.id ||
        message?.conversationId ||
        payload.threadId ||
        payload.thread?.id;

      if (!threadId || threadId !== activeThreadIdRef.current) return;

      if (message) {
        upsertMessage({ ...message, tempId: payload.tempId || message.tempId });
        if (
          socketRef.current?.connected &&
          message.senderId !== currentUserIdRef.current
        ) {
          socketRef.current.emit("chat:mark-read", { threadId });
        }
      }
    },
    [upsertMessage, upsertThread]
  );

  const handleThreadUpdate = useCallback(
    (thread) => {
      if (thread?.id) {
        upsertThread(thread);
      }
    },
    [upsertThread]
  );

  const loadMoreThreads = useCallback(async () => {
    if (loadingMoreThreads || !hasMoreThreads || !threadsCursor) return [];

    setLoadingMoreThreads(true);
    try {
      const data = await fetchChatThreads({
        limit: 20,
        cursor: threadsCursor,
        fields: THREAD_FIELDS,
      });
      const list = data?.threads ?? data ?? [];

      if (list.length) {
        setThreads((prev) => sortThreads(mergeThreads(prev, list)));
      }

      setHasMoreThreads(data?.hasMore ?? list.length > 0);
      setThreadsCursor(data?.nextCursor ?? null);

      return list;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to load conversations";
      setChatError(message);
      return [];
    } finally {
      setLoadingMoreThreads(false);
    }
  }, [hasMoreThreads, loadingMoreThreads, threadsCursor]);

  const connectChat = useCallback(
    async (user, token) => {
      if (!user?._id || !token || isConnectingRef.current) return;

      const userId = user._id;
      const isSameUser = currentUserIdRef.current === userId;

      currentUserIdRef.current = userId;

      if (socketRef.current?.connected && isSameUser) {
        await refreshThreads();
        return;
      }

      isConnectingRef.current = true;
      setChatLoading(true);
      setChatError(null);

      cleanupSocket();

      try {
        const socket = connectChatSocket(token);
        socketRef.current = socket;

        socket.on("chat:message:new", handleIncomingMessage);
        socket.on("chat:thread:update", handleThreadUpdate);
        socket.on("connect_error", (err) => {
          setChatError(err?.message || "Unable to connect to chat");
        });

        socket.connect();
        await refreshThreads({ fullReload: true });
      } catch (error) {
        setChatError(error?.message || "Unable to connect to chat");
      } finally {
        setChatLoading(false);
        isConnectingRef.current = false;
      }
    },
    [
      cleanupSocket,
      handleIncomingMessage,
      handleThreadUpdate,
      refreshThreads,
    ]
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      const thread = activeThread;
      if (!trimmed || !thread) return;

      const threadId = thread.id;
      const partnerId = thread.partnerId || thread.partner?._id;

      const tempId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}`;

      const optimistic = {
        id: tempId,
        tempId,
        senderId: currentUserIdRef.current,
        recipientId: partnerId,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      upsertMessage(optimistic);
      upsertThread({
        ...thread,
        lastMessage: trimmed,
        lastMessageAt: optimistic.createdAt,
        lastSender: currentUserIdRef.current,
      });

      const payload = { threadId, toUserId: partnerId, text: trimmed, tempId };
      const socket = socketRef.current;

      const handleSuccess = (data) => {
        if (data?.message) {
          upsertMessage({ ...data.message, tempId });
        }
        if (data?.thread) {
          upsertThread(data.thread);
        }
      };

      if (socket?.connected) {
        socket.emit("chat:send-message", payload, (response) => {
          if (!response?.ok || response?.error) {
            setChatError(response?.error || "Unable to send message");
            return;
          }
          handleSuccess(response);
        });
      } else {
        try {
          const response = await sendChatMessage(payload);
          handleSuccess(response);
        } catch (_error) {
          setChatError("Unable to send message");
        }
      }
    },
    [activeThread, upsertMessage, upsertThread]
  );

  const loadOlderMessages = useCallback(async () => {
    if (loadingMoreMessages || !hasMoreMessages) return;
    const threadId = activeThreadIdRef.current;
    if (!threadId || !messages.length) return;

    const oldest = messages[0];
    if (!oldest?.createdAt) return;

    setLoadingMoreMessages(true);
    try {
      const older = await fetchThreadMessages(threadId, {
        before: oldest.createdAt,
        limit: 20,
      });

      if (!older.length) {
        setHasMoreMessages(false);
        return;
      }

      setHasMoreMessages(older.length >= 20);

      setMessages((prev) => {
        const existing = new Set(
          prev.map((msg) => msg.id || msg.tempId || msg._id)
        );
        const deduped = older.filter(
          (msg) => !existing.has(msg.id || msg.tempId || msg._id)
        );
        const merged = [...deduped, ...prev];
        return merged.sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
        );
      });
    } catch (_error) {
      setChatError("Unable to load older messages");
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [hasMoreMessages, loadingMoreMessages, messages]);

  useEffect(() => {
    return () => {
      disconnectChat();
    };
  }, [disconnectChat]);

  return {
    threads,
    hasMoreThreads,
    chatLoading,
    chatError,
    activeThread,
    messages,
    selectingThread,
    hasMoreMessages,
    loadingMoreMessages,
    loadingMoreThreads,
    connectChat,
    disconnectChat,
    refreshThreads,
    loadMoreThreads,
    openThread,
    startDirectChat,
    closeThread,
    sendMessage,
    loadOlderMessages,
  };
};

export default useChat;
