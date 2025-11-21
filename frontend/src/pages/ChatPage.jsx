import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { SendIcon } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import {
  getChatThreadWithUser,
  markChatThreadRead,
  sendChatMessage,
} from "../lib/api";
import useChatSocket from "../hooks/useChatSocket";
import ChatLoader from "../components/ChatLoader";
import EmojiPickerButton from "../components/EmojiPickerButton";
import { useTranslation } from "../languages/useTranslation";
import { formatRelativeTimeFromNow } from "../utils/time";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { authUser } = useAuthUser();
  const { t, language } = useTranslation();
  const socket = useChatSocket(Boolean(authUser));
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const messageListRef = useRef(null);

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
      </header>

      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto bg-base-200/40 px-4 py-6 space-y-4"
      >
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

          return (
            <div
              key={message.id || message.tempId}
              className={`flex flex-col ${alignment} gap-1`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow ${bubbleClasses}`}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              </div>
              <span className="text-[11px] text-base-content/60">
                {timestamp || ""}
              </span>
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
