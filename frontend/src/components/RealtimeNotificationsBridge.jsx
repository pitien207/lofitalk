import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useChatSocket from "../hooks/useChatSocket";
import { syncPushSubscription } from "../utils/pushNotifications";

// Server -> client "something changed" hints (backend NotifyTopic). They replace
// the old polling: the client refetches only the affected queries through the API.
const TOPIC_QUERY_KEYS = {
  friendRequests: [
    ["friendRequests"],
    ["outgoingFriendReqs"],
    ["friends"],
    ["users"],
    ["blockedUsers"],
  ],
  adminNotifications: [["adminNotifications"]],
  reports: [["adminPendingReports"], ["adminReports"]],
};

const ALL_KEYS = Object.values(TOPIC_QUERY_KEYS).flat();

const RealtimeNotificationsBridge = () => {
  const socket = useChatSocket(true);
  const queryClient = useQueryClient();

  // Mounted after login: hand this browser's push subscription to the current account.
  useEffect(() => {
    syncPushSubscription();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const invalidate = (keys) =>
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

    const handleChanged = ({ topic } = {}) => {
      const keys = TOPIC_QUERY_KEYS[topic];
      if (keys) invalidate(keys);
    };

    // Events sent while the connection was down are lost: catch up after every reconnect.
    let hasConnectedBefore = socket.connected;
    const handleConnect = () => {
      if (hasConnectedBefore) invalidate(ALL_KEYS);
      hasConnectedBefore = true;
    };

    socket.on("notify:changed", handleChanged);
    socket.on("connect", handleConnect);
    return () => {
      socket.off("notify:changed", handleChanged);
      socket.off("connect", handleConnect);
    };
  }, [socket, queryClient]);

  return null;
};

export default RealtimeNotificationsBridge;
