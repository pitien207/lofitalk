import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useAuthUser from "./useAuthUser";
import useNotificationSound from "./useNotificationSound";
import {
  getChatUnreadCount,
} from "../lib/api";
import useChatSocket from "./useChatSocket";

const useUnreadChats = () => {
  const { authUser } = useAuthUser();
  const socket = useChatSocket(Boolean(authUser));
  const playNotificationSound = useNotificationSound();

  const {
    data,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["chatUnreadCount"],
    queryFn: getChatUnreadCount,
    enabled: Boolean(authUser),
    refetchOnWindowFocus: true,
  });

  const unreadCount = useMemo(() => data?.count ?? 0, [data]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleThreadUpdate = () => refetch();
    const handleNewMessage = (payload) => {
      const senderId =
        payload?.message?.senderId ||
        payload?.message?.sender ||
        payload?.message?.user_id;

      if (senderId && senderId !== authUser?._id) {
        playNotificationSound();
      }

      refetch();
    };

    socket.on("chat:thread:update", handleThreadUpdate);
    socket.on("chat:message:new", handleNewMessage);

    return () => {
      socket.off("chat:thread:update", handleThreadUpdate);
      socket.off("chat:message:new", handleNewMessage);
    };
  }, [socket, refetch, playNotificationSound, authUser]);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    loading: isFetching,
  };
};

export default useUnreadChats;
