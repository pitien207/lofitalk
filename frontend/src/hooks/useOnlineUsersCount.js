import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import useAuthUser from "./useAuthUser";
import { getOnlineUsersCount } from "../lib/api";
import useChatSocket from "./useChatSocket";

const useOnlineUsersCount = () => {
  const { authUser } = useAuthUser();
  const socket = useChatSocket(Boolean(authUser));

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["onlineUsersCount"],
    queryFn: getOnlineUsersCount,
    enabled: Boolean(authUser),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => refetch();
    socket.on("chat:ready", refresh);
    socket.on("connect", refresh);
    socket.on("disconnect", refresh);

    return () => {
      socket.off("chat:ready", refresh);
      socket.off("connect", refresh);
      socket.off("disconnect", refresh);
    };
  }, [socket, refetch]);

  return { count: data?.count ?? null, loading: isFetching };
};

export default useOnlineUsersCount;
