import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

const WS_URL = SOCKET_URL;

let socketInstance = null;

export const getChatSocket = (token) => {
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket"],
      auth: token ? { token } : undefined,
    });
  } else if (token) {
    socketInstance.auth = { token };
  }

  return socketInstance;
};

export const connectChatSocket = (token) => {
  const socket = getChatSocket(token);
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectChatSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
