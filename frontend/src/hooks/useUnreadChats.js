import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import useAuthUser from "./useAuthUser";
import { getStreamToken } from "../lib/api";

const FALLBACK_STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const useUnreadChats = () => {
  const { authUser } = useAuthUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: Boolean(authUser),
  });

  useEffect(() => {
    if (!authUser || !tokenData?.token) return;

    let isMounted = true;
    let subscriptions = [];

    const client = StreamChat.getInstance(
      tokenData?.apiKey || FALLBACK_STREAM_API_KEY
    );

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

    const updateUnreadCount = (channels = []) => {
      if (!isMounted) return;
      const total = channels.reduce((sum, channel) => {
        const readState = channel?.state?.read?.[authUser._id] || {};
        const unread = readState.unread_messages || 0;
        return sum + unread;
      }, 0);
      setUnreadCount(total);
    };

    const loadChannels = async () => {
      try {
        await ensureConnected();
        const result = await client.queryChannels(
          { type: "messaging", members: { $in: [authUser._id] } },
          { last_message_at: -1 },
          { watch: true, state: true }
        );
        updateUnreadCount(result);
      } catch (error) {
        console.error("Failed to load unread chats", error);
      }
    };

    loadChannels();

    const refresh = () => loadChannels();
    subscriptions = [
      client.on("message.new", refresh),
      client.on("message.read", refresh),
      client.on("notification.mark_read", refresh),
      client.on("channel.truncated", refresh),
      client.on("channel.updated", refresh),
    ];

    return () => {
      isMounted = false;
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [authUser, tokenData]);

  return { unreadCount, hasUnread: unreadCount > 0 };
};

export default useUnreadChats;
