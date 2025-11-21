import { useEffect, useState } from "react";
import useAuthUser from "./useAuthUser";
import { connectChatSocket, getChatSocket, disconnectChatSocket } from "../lib/chatSocket";

const useChatSocket = (enabled = true) => {
  const { authUser } = useAuthUser();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!enabled || !authUser) {
      disconnectChatSocket();
      setSocket(null);
      return undefined;
    }

    const instance = connectChatSocket();
    setSocket(instance);

    return undefined;
  }, [authUser, enabled]);

  return socket;
};

export default useChatSocket;
