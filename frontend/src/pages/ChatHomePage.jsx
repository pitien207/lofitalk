import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import useAuthUser from "../hooks/useAuthUser";
import { getChatThreads } from "../lib/api";
import ChatLoader from "../components/ChatLoader";
import { useTranslation } from "../languages/useTranslation";
import { formatRelativeTimeFromNow } from "../utils/time";
import useChatSocket from "../hooks/useChatSocket";

const ChatHomePage = () => {
  const { authUser } = useAuthUser();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const socket = useChatSocket(Boolean(authUser));
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["chatThreads"],
    queryFn: getChatThreads,
    enabled: Boolean(authUser),
  });

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: ["chatThreads"] });

    socket.on("chat:thread:update", refresh);
    socket.on("chat:message:new", refresh);

    return () => {
      socket.off("chat:thread:update", refresh);
      socket.off("chat:message:new", refresh);
    };
  }, [socket, queryClient]);

  const handleOpenChat = (userId) => {
    if (!userId) {
      toast.error("Unable to open chat");
      return;
    }
    navigate(`/chat/${userId}`);
  };

  const renderThreadCard = (thread) => {
    const partner = thread?.partner || {};
    const partnerId = thread?.partnerId;
    const partnerName = partner.fullName || t("common.loading");
    const partnerImage = partner.profilePic;
    const isOnline = Boolean(partner?.isOnline);
    const presenceDotClass = isOnline ? "bg-success" : "bg-base-300";

    const previewText = thread?.lastMessage || t("chatHome.noMessages");
    const previewTimeLabel = thread?.lastMessageAt
      ? formatRelativeTimeFromNow(thread.lastMessageAt, language)
      : "";
    const unreadCount = thread?.unreadCount || 0;
    const hasUnread = unreadCount > 0;

    return (
      <button
        type="button"
        key={thread.id}
        onClick={() => handleOpenChat(partnerId)}
        disabled={!partnerId}
        className="flex w-full items-center gap-3 px-3 py-3 transition hover:bg-base-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="relative">
          {partnerImage ? (
            <img
              src={partnerImage}
              alt={partnerName}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 text-sm font-semibold text-base-content/70">
              {partnerName?.charAt(0) ?? "?"}
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 block size-3 rounded-full border-2 border-base-100 ${presenceDotClass}`}
          />
          {hasUnread && (
            <span className="absolute -top-1 -left-1 block size-3 rounded-full bg-error ring-2 ring-base-100" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="min-w-0 text-left">
            <p className="font-semibold truncate">{partnerName}</p>
            <p className="text-sm text-base-content/70 truncate">{previewText}</p>
          </div>
          {previewTimeLabel && (
            <span className="text-xs text-base-content/60 whitespace-nowrap">{previewTimeLabel}</span>
          )}
        </div>
      </button>
    );
  };

  const threads = data?.threads || [];
  const shouldShowLoader = isLoading && !data;

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        {shouldShowLoader ? (
          <ChatLoader />
        ) : threads.length === 0 ? (
          <div className="rounded-3xl border border-base-300 bg-base-100/80 p-8 text-center shadow">
            <p className="text-lg font-semibold text-base-content">
              {t("chatHome.empty")}
            </p>
            <p className="mt-2 text-sm text-base-content/70">
              {t("chatHome.emptyHint")}
            </p>
          </div>
        ) : (
          <section className="rounded-3xl border border-base-300 bg-base-100/90 shadow divide-y divide-base-200 overflow-hidden">
            {threads.map((thread) => renderThreadCard(thread))}
          </section>
        )}
      </div>
    </div>
  );
};

export default ChatHomePage;
