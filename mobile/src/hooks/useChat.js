import { useCallback, useEffect, useRef, useState } from "react";
import { StreamChat } from "stream-chat";
import { fetchStreamToken } from "../services/chatService";

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY;

const useChat = () => {
  const [channels, setChannels] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectingChannel, setSelectingChannel] = useState(false);

  const channelSubscriptionRef = useRef(null);
  const clientSubscriptionRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const clientRef = useRef(null);
  const isConnectingRef = useRef(false);

  const cleanupChannelListeners = useCallback(() => {
    if (channelSubscriptionRef.current?.unsubscribe) {
      channelSubscriptionRef.current.unsubscribe();
    }
    channelSubscriptionRef.current = null;
  }, []);

  const cleanupClientListeners = useCallback(() => {
    if (clientSubscriptionRef.current?.unsubscribe) {
      clientSubscriptionRef.current.unsubscribe();
    }
    clientSubscriptionRef.current = null;
  }, []);

  const queryChannels = useCallback(async (connectedClient, userId) => {
    if (!connectedClient || !userId) return [];

    const filter = { type: "messaging", members: { $in: [userId] } };
    const sort = { last_message_at: -1 };

    const channelList = await connectedClient.queryChannels(filter, sort, {
      watch: true,
      state: true,
      presence: true,
    });

    setChannels(channelList);
    return channelList;
  }, []);

  const disconnectChat = useCallback(async () => {
    cleanupChannelListeners();
    cleanupClientListeners();
    setActiveChannel(null);
    setMessages([]);
    currentUserIdRef.current = null;

    if (clientRef.current) {
      try {
        await clientRef.current.disconnectUser();
      } catch (error) {
        console.log("Error disconnecting chat client:", error);
      }
    }

    clientRef.current = null;
    setChannels([]);
  }, [cleanupChannelListeners, cleanupClientListeners]);

  const connectChat = useCallback(
    async (user) => {
      if (!user || !user._id || isConnectingRef.current) return;
      if (!STREAM_API_KEY) {
        setChatError("Missing Stream API key.");
        return;
      }

      if (currentUserIdRef.current === user._id && clientRef.current) {
        await queryChannels(clientRef.current, user._id);
        return;
      }

      isConnectingRef.current = true;
      setChatLoading(true);
      setChatError(null);

      await disconnectChat();

      try {
        const token = await fetchStreamToken();
        if (!token) {
          throw new Error("Unable to fetch chat token");
        }

        const streamClient = StreamChat.getInstance(STREAM_API_KEY);
        await streamClient.connectUser(
          {
            id: user._id,
            name: user.fullName || "Friend",
            image: user.profilePic || undefined,
          },
          token
        );

        currentUserIdRef.current = user._id;
        clientRef.current = streamClient;

        await queryChannels(streamClient, user._id);

        const subscription = streamClient.on((event) => {
          if (
            event.type === "message.new" ||
            event.type === "message.updated" ||
            event.type === "message.deleted"
          ) {
            setChannels((prev) => [...prev]);
          }
        });
        clientSubscriptionRef.current = subscription;
      } catch (error) {
        console.log("Chat init error:", error);
        setChatError(error?.message || "Unable to connect to chat");
      } finally {
        setChatLoading(false);
        isConnectingRef.current = false;
      }
    },
    [disconnectChat, queryChannels]
  );

  const refreshChannels = useCallback(async () => {
    if (clientRef.current && currentUserIdRef.current) {
      await queryChannels(clientRef.current, currentUserIdRef.current);
    }
  }, [queryChannels]);

  const openChannel = useCallback(
    async (channelId) => {
      if (!clientRef.current || !channelId) return;

      const targetChannel =
        channels.find((item) => item.id === channelId) ||
        clientRef.current.activeChannels?.[`messaging:${channelId}`];

      if (!targetChannel) {
        setChatError("Channel not found");
        return;
      }

      setSelectingChannel(true);
      setChatError(null);
      cleanupChannelListeners();

      try {
        await targetChannel.watch({ presence: true });
        setActiveChannel(targetChannel);
        setMessages([...targetChannel.state.messages]);
        targetChannel.markRead();

        const subscription = targetChannel.on((event) => {
          if (
            event.type === "message.new" ||
            event.type === "message.updated" ||
            event.type === "message.deleted"
          ) {
            setMessages([...targetChannel.state.messages]);
            setChannels((prev) => [...prev]);
          }
        });
        channelSubscriptionRef.current = subscription;
      } catch (error) {
        console.log("Open channel error:", error);
        setChatError("Unable to open chat right now");
      } finally {
        setSelectingChannel(false);
      }
    },
    [channels, cleanupChannelListeners]
  );

  const closeChannel = useCallback(() => {
    cleanupChannelListeners();
    setActiveChannel(null);
    setMessages([]);
  }, [cleanupChannelListeners]);

  const sendMessage = useCallback(
    async (text) => {
      if (!activeChannel || !text?.trim()) return;

      try {
        await activeChannel.sendMessage({ text: text.trim() });
        setMessages([...activeChannel.state.messages]);
        setChannels((prev) => [...prev]);
      } catch (error) {
        console.log("Send message error:", error);
        setChatError("Unable to send message");
      }
    },
    [activeChannel]
  );

  useEffect(() => {
    return () => {
      disconnectChat();
    };
  }, [disconnectChat]);

  return {
    channels,
    chatLoading,
    chatError,
    activeChannel,
    messages,
    selectingChannel,
    connectChat,
    disconnectChat,
    refreshChannels,
    openChannel,
    closeChannel,
    sendMessage,
  };
};

export default useChat;
