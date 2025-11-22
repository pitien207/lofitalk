import { io } from "socket.io-client";
import Constants from "expo-constants";
import { API_BASE_URL } from "../services/api";

const DEFAULT_WS_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5001"
    : "https://lofitalk.onrender.com";

const resolveWsUrl = () => {
  const explicit =
    process.env.EXPO_PUBLIC_CHAT_WS_URL ||
    Constants.expoConfig?.extra?.chatWsUrl;

  if (explicit) return explicit;

  if (API_BASE_URL) {
    const normalized = API_BASE_URL.replace(/\/api\/?$/, "");
    if (normalized) return normalized;
  }

  return DEFAULT_WS_URL;
};

const WS_URL = resolveWsUrl();

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
