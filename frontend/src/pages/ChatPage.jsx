import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken, getUserProfile } from "../lib/api";

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import EmojiPickerButton from "../components/EmojiPickerButton";
import { useTranslation } from "../languages/useTranslation";
import { formatRelativeTimeFromNow } from "../utils/time";

const FALLBACK_STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();
  const { t, language } = useTranslation();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  const { data: chatPartner, isLoading: isPartnerLoading } = useQuery({
    queryKey: ["user-profile", targetUserId],
    queryFn: () => getUserProfile(targetUserId),
    enabled: Boolean(authUser && targetUserId),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      const resolvedApiKey = tokenData?.apiKey || FALLBACK_STREAM_API_KEY;
      if (!resolvedApiKey) {
        toast.error("Missing Stream API key");
        setLoading(false);
        return;
      }

      try {
        const client = StreamChat.getInstance(resolvedApiKey);
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

        //
        const channelId = [authUser._id, targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl =
        process.env.NODE_ENV === "production"
          ? `https://lofitalk.onrender.com/call/${channel.id}`
          : `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  const presenceText = useMemo(() => {
    if (!chatPartner) return "";
    if (chatPartner.isOnline) return t("common.presence.online");
    if (chatPartner.lastActiveAt) {
      const relative = formatRelativeTimeFromNow(
        chatPartner.lastActiveAt,
        language
      );
      return relative
        ? t("common.presence.offline", { timeAgo: relative })
        : t("common.presence.offlineUnknown");
    }
    return t("common.presence.offlineUnknown");
  }, [chatPartner, language, t]);

  const presenceDotClass = chatPartner?.isOnline ? "bg-success" : "bg-base-300";
  const partnerInitial =
    chatPartner?.fullName?.trim().charAt(0)?.toUpperCase() || "?";
  const partnerName = chatPartner?.fullName || t("common.loading");

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel} EmojiPicker={EmojiPickerButton}>
          <Window>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 bg-base-100/90 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  {chatPartner?.profilePic ? (
                    <img
                      src={chatPartner.profilePic}
                      alt={chatPartner.fullName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 text-sm font-semibold text-base-content/70">
                      {partnerInitial}
                    </div>
                  )}
                  {chatPartner && (
                    <span
                      className={`absolute bottom-0 right-0 block size-3 rounded-full border-2 border-base-100 ${presenceDotClass}`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{partnerName}</p>
                  <p className="text-xs text-base-content/70">
                    {isPartnerLoading && !chatPartner ? t("common.loading") : presenceText}
                  </p>
                </div>
              </div>
              <CallButton handleVideoCall={handleVideoCall} />
            </div>
            <MessageList />
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
