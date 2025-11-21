import { io } from "socket.io-client";

const DEFAULT_WS_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "https://lofitalk.onrender.com";

const WS_URL = import.meta.env.VITE_CHAT_WS_URL || DEFAULT_WS_URL;

let socketInstance = null;

export const getChatSocket = () => {
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socketInstance;
};

export const connectChatSocket = () => {
  const socket = getChatSocket();
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
