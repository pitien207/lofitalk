import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MoreVerticalIcon, SendIcon, Trash2Icon } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import {
  getChatThreadWithUser,
  markChatThreadRead,
  sendChatMessage,
  getChatMessages,
  clearChatThread,
} from "../lib/api";
import useChatSocket from "../hooks/useChatSocket";
import ChatLoader from "../components/ChatLoader";
import EmojiPickerButton from "../components/EmojiPickerButton";
import { useTranslation } from "../languages/useTranslation";
import { formatRelativeTimeFromNow } from "../utils/time";

const PAGE_SIZE = 20;

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { authUser } = useAuthUser();
  const { t, language } = useTranslation();
  const socket = useChatSocket(Boolean(authUser));
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const messageListRef = useRef(null);
  const actionMenuRef = useRef(null);
  const [visibleTimestamps, setVisibleTimestamps] = useState(() => new Set());

  const {
    data: threadData,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["chatThread", targetUserId],
    queryFn: () => getChatThreadWithUser(targetUserId),
    enabled: Boolean(authUser && targetUserId),
  });

  const threadId = threadData?.thread?.id;
  const partner = threadData?.partner || threadData?.thread?.partner || null;

  useEffect(() => {
    if (threadData?.messages) {
      setMessages(threadData.messages);
      setHasMore((threadData.messages || []).length >= PAGE_SIZE);
    }
  }, [threadData]);

  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!threadId) return;
    if (socket) {
      socket.emit("chat:join", { threadId });
      socket.emit("chat:mark-read", { threadId });
    } else {
      markChatThreadRead(threadId).catch(() => undefined);
    }
  }, [socket, threadId]);

  const upsertMessage = useCallback((incoming) => {
    if (!incoming?.id && !incoming?.tempId) return;
    setMessages((prev) => {
      const next = [...prev];

      const findIndexById = (list, id) =>
        list.findIndex(
          (entry) => entry.id === id || (id && entry.tempId === id)
        );

      const existingIndex = findIndexById(next, incoming.id);
      const tempIndex =
        existingIndex === -1 && incoming.tempId
          ? findIndexById(next, incoming.tempId)
          : -1;

      const indexToUpdate =
        existingIndex !== -1 ? existingIndex : tempIndex !== -1 ? tempIndex : -1;

      if (indexToUpdate !== -1) {
        next[indexToUpdate] = { ...next[indexToUpdate], ...incoming };
      } else {
        next.push(incoming);
      }

      return next.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, []);

  useEffect(() => {
    if (!socket || !threadId) return undefined;

    const handleNewMessage = (payload = {}) => {
      const incomingThreadId =
        payload.thread?.id ||
        payload.message?.conversationId ||
        payload.threadId;

      if (incomingThreadId && incomingThreadId !== threadId) return;
      if (!payload.message) return;

      upsertMessage({ ...payload.message, tempId: payload.tempId || null });
      socket.emit("chat:mark-read", { threadId });
    };

    const handleThreadUpdate = (thread) => {
      if (thread?.id === threadId) {
        queryClient.invalidateQueries({ queryKey: ["chatThreads"] });
      }
    };

    socket.on("chat:message:new", handleNewMessage);
    socket.on("chat:thread:update", handleThreadUpdate);

    return () => {
      socket.off("chat:message:new", handleNewMessage);
      socket.off("chat:thread:update", handleThreadUpdate);
    };
  }, [socket, threadId, upsertMessage, queryClient]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setVisibleTimestamps(new Set());
    setHasMore(true);
    setLoadingMore(false);
    setIsMenuOpen(false);
    setIsClearing(false);
  }, [threadId]);

  const toggleTimestampVisibility = useCallback((messageId) => {
    if (!messageId) return;
    setVisibleTimestamps((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  const handleClearConversation = async () => {
    if (!threadId) {
      toast.error(t("chatPage.clearError") || "Unable to clear chat");
      return;
    }

    setIsClearing(true);
    try {
      await clearChatThread(threadId);
      setMessages([]);
      setHasMore(false);
      setVisibleTimestamps(new Set());
      queryClient.invalidateQueries({ queryKey: ["chatThreads"] });
      toast.success(
        t("chatPage.clearSuccess") || "Messages deleted for you"
      );
    } catch (error) {
      const fallbackMessage =
        error?.response?.data?.message ||
        t("chatPage.clearError") ||
        "Unable to clear chat";
      toast.error(fallbackMessage);
    } finally {
      setIsClearing(false);
      setIsMenuOpen(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text) return;
    if (!threadId && !targetUserId) {
      toast.error("Missing chat destination");
      return;
    }

    const tempId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}`;

    const optimisticMessage = {
      id: tempId,
      tempId,
      senderId: authUser._id,
      recipientId: targetUserId,
      text,
      createdAt: new Date().toISOString(),
    };

    upsertMessage(optimisticMessage);
    setMessageText("");

    const sendPayload = { threadId, toUserId: targetUserId, text, tempId };

    if (socket) {
      socket.emit("chat:send-message", sendPayload, (response) => {
        if (!response?.ok || response?.error) {
          toast.error(response?.error || "Unable to send message");
          return;
        }
        if (response.message) {
          upsertMessage({ ...response.message, tempId });
        }
      });
    } else {
      try {
        const response = await sendChatMessage(sendPayload);
        if (response?.message) {
          upsertMessage({ ...response.message, tempId });
        }
      } catch (error) {
        toast.error("Unable to send message");
      }
    }
  };

  const fetchOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const oldest = messages[0];
    if (!oldest || !threadId) return;

    setLoadingMore(true);
    const listEl = messageListRef.current;
    const prevScrollHeight = listEl?.scrollHeight || 0;
    const prevScrollTop = listEl?.scrollTop || 0;

    try {
      const response = await getChatMessages(threadId, {
        before: oldest.createdAt,
        limit: PAGE_SIZE,
      });

      const incoming = response?.messages || [];
      if (!incoming.length) {
        setHasMore(false);
        return;
      }

      setHasMore(incoming.length >= PAGE_SIZE);

      setMessages((prev) => {
        const existingIds = new Set(
          prev.map((msg) => msg.id || msg.tempId || msg._id)
        );
        const deduped = incoming.filter(
          (msg) =>
            !existingIds.has(msg.id || msg.tempId || msg._id)
        );
        const merged = [...deduped, ...prev];
        return merged.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      // Preserve scroll position so content doesn't jump when prepending
      requestAnimationFrame(() => {
        if (!listEl) return;
        const newScrollHeight = listEl.scrollHeight || prevScrollHeight;
        const delta = newScrollHeight - prevScrollHeight;
        listEl.scrollTop = prevScrollTop + delta;
      });
    } catch (_error) {
      // swallow; optional toast could be added
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, threadId]);

  const handleScroll = useCallback(() => {
    const el = messageListRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop <= 12) {
      fetchOlderMessages();
    }
  }, [fetchOlderMessages, loadingMore, hasMore]);

  const presenceText = useMemo(() => {
    if (!partner) return "";
    if (partner.isOnline) return t("common.presence.online");
    if (partner.lastActiveAt) {
      const relative = formatRelativeTimeFromNow(partner.lastActiveAt, language);
      return relative
        ? t("common.presence.offline", { timeAgo: relative })
        : t("common.presence.offlineUnknown");
    }
    return t("common.presence.offlineUnknown");
  }, [partner, language, t]);

  const isLoadingThread = (isLoading || isFetching) && !threadData;

  if (isLoadingThread) return <ChatLoader />;

  if (isError || !threadId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-base-300 bg-base-100/80 px-6 py-8 shadow">
          <p className="text-lg font-semibold text-base-content">
            {t("common.error") || "Unable to open chat"}
          </p>
          <p className="mt-2 text-base-content/70">
            {t("chatHome.emptyHint")}
          </p>
        </div>
      </div>
    );
  }

  const presenceDotClass = partner?.isOnline ? "bg-success" : "bg-base-300";
  const partnerInitial =
    partner?.fullName?.trim().charAt(0)?.toUpperCase() || "?";
  const partnerName = partner?.fullName || t("common.loading");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-base-200 bg-base-100/90 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            {partner?.profilePic ? (
              <img
                src={partner.profilePic}
                alt={partner.fullName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 text-sm font-semibold text-base-content/70">
                {partnerInitial}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 block size-3 rounded-full border-2 border-base-100 ${presenceDotClass}`}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{partnerName}</p>
            <p className="text-xs text-base-content/70">
              {presenceText || t("common.loading")}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div ref={actionMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="btn btn-ghost btn-sm px-2"
              disabled={!threadId || isClearing}
            >
              <MoreVerticalIcon className="size-5" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-base-200 bg-base-100 shadow-lg">
                <button
                  type="button"
                  onClick={handleClearConversation}
                  disabled={isClearing}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2Icon className="size-4" />
                  {isClearing
                    ? t("chatPage.clearing") || "Deleting..."
                    : t("chatPage.clearForMe") || "Delete chat for me"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        ref={messageListRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-base-200/40 px-4 py-6 space-y-4"
      >
        {loadingMore && (
          <div className="flex justify-center text-xs text-base-content/60">
            {t("common.loading") || "Loading..."}
          </div>
        )}
        {messages.map((message) => {
          const isMine = message.senderId === authUser?._id;
          const alignment = isMine ? "items-end" : "items-start";
          const bubbleClasses = isMine
            ? "bg-primary text-primary-content"
            : "bg-base-100 text-base-content";
          const timestamp = formatRelativeTimeFromNow(
            message.createdAt,
            language
          );
          const messageKey = message.id || message.tempId;
          const showTimestamp = messageKey && visibleTimestamps.has(messageKey);

          return (
            <div
              key={messageKey}
              className={`flex flex-col ${alignment} gap-1 cursor-pointer`}
              onClick={() => toggleTimestampVisibility(messageKey)}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow ${bubbleClasses}`}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              </div>
              {showTimestamp && (
                <span className="text-[11px] text-base-content/60">
                  {timestamp || ""}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <footer className="border-t border-base-200 bg-base-100 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t("common.messagePlaceholder") || "Type a message..."}
            className="input input-bordered flex-1"
          />
          <EmojiPickerButton onSelect={(emoji) => setMessageText((prev) => `${prev}${emoji}`)} />
          <button
            type="submit"
            className="btn btn-primary text-white gap-2"
            disabled={!messageText.trim()}
          >
            <SendIcon className="size-4" />
            {t("common.send") || "Send"}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;
