import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken } from "../lib/api";
import ChatLoader from "../components/ChatLoader";
import { useTranslation } from "../languages/useTranslation";
import { formatRelativeTimeFromNow } from "../utils/time";

const FALLBACK_STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatHomePage = () => {
  const { authUser } = useAuthUser();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [chatClient, setChatClient] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: Boolean(authUser),
  });

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    let isMounted = true;
    let subscriptions = [];

    const resolvedApiKey = tokenData?.apiKey || FALLBACK_STREAM_API_KEY;
    if (!resolvedApiKey) {
      toast.error("Missing Stream API key");
      setLoading(false);
      return;
    }

    const client = StreamChat.getInstance(resolvedApiKey);

    const ensureConnected = async () => {
      if (client.userID && client.userID !== authUser._id) {
        await client.disconnectUser();
      }

      if (!client.userID) {
        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );
      }
    };

    const loadChannels = async () => {
      try {
        const result = await client.queryChannels(
          { type: "messaging", members: { $in: [authUser._id] } },
          { last_message_at: -1 },
          { watch: true, state: true }
        );

        if (isMounted) {
          setChannels(result);
        }
      } catch (error) {
        console.error("Error loading chat channels:", error);
        if (isMounted) {
          toast.error("Unable to load chats");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const init = async () => {
      try {
        await ensureConnected();
        if (!isMounted) return;
        setChatClient(client);
        await loadChannels();
        const refresh = () => loadChannels();
        subscriptions = [
          client.on("message.new", refresh),
          client.on("channel.updated", refresh),
          client.on("channel.visible", refresh),
          client.on("user.presence.changed", refresh),
          client.on("user.updated", refresh),
        ];
      } catch (error) {
        console.error("Error initializing chat list:", error);
        if (isMounted) {
          toast.error("Could not connect to chat. Please try again.");
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [tokenData, authUser]);

  const handleOpenChat = (userId) => {
    if (!userId) return;
    navigate(`/chat/${userId}`);
  };

  const renderChannelCard = (channel) => {
    const members = Object.values(channel?.state?.members || {});
    const otherMember = members.find((member) => member.user_id !== authUser?._id);
    const partnerId =
      otherMember?.user_id ||
      otherMember?.user?.id ||
      channel.id?.split("-").find((id) => id !== authUser?._id);

    const isOnline = Boolean(otherMember?.user?.online);
    const presenceDotClass = isOnline ? "bg-success" : "bg-base-300";

    const partnerName =
      otherMember?.user?.name ||
      channel?.data?.name ||
      t("common.loading");
    const partnerImage = otherMember?.user?.image;

    const messages = channel?.state?.messages || [];
    const lastMessage =
      [...messages].reverse().find((message) => message.type === "regular") ||
      messages[messages.length - 1];
    const previewText = lastMessage?.text || t("chatHome.noMessages");
    const previewTime =
      lastMessage?.created_at || channel?.state?.last_message_at;
    const previewTimeLabel = previewTime
      ? formatRelativeTimeFromNow(previewTime, language)
      : "";

    return (
      <button
        type="button"
        key={channel.id}
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

  const shouldShowLoader = loading || !chatClient;

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        {shouldShowLoader ? (
          <ChatLoader />
        ) : channels.length === 0 ? (
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
            {channels.map((channel) => renderChannelCard(channel))}
          </section>
        )}
      </div>
    </div>
  );
};

export default ChatHomePage;
