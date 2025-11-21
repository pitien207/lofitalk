import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import useAuthUser from "./useAuthUser";
import { getStreamToken } from "../lib/api";

const FALLBACK_STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const useOnlineUsersCount = () => {
  const { authUser } = useAuthUser();
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: Boolean(authUser),
  });

  useEffect(() => {
    if (!authUser || !tokenData?.token) return;

    let isMounted = true;
    let client = null;

    const fetchOnlineCount = async () => {
      setLoading(true);
      try {
        client = StreamChat.getInstance(
          tokenData?.apiKey || FALLBACK_STREAM_API_KEY
        );

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

        const result = await client.queryUsers(
          { id: { $ne: authUser._id } },
          { last_active: -1 },
          { presence: true, limit: 200 }
        );

        const onlineUsers = result?.users?.filter((user) => user.online) || [];
        if (isMounted) {
          setCount(onlineUsers.length);
        }
      } catch (error) {
        console.error("Failed to fetch online count", error);
        if (isMounted) setCount(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOnlineCount();

    return () => {
      isMounted = false;
    };
  }, [authUser, tokenData]);

  return { count, loading };
};

export default useOnlineUsersCount;
