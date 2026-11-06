import { io } from "socket.io-client";

// Production: the backend serves this app, so the socket lives on the same origin.
const DEFAULT_WS_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : window.location.origin;

const WS_URL = import.meta.env.VITE_CHAT_WS_URL || DEFAULT_WS_URL;

let socketInstance = null;
// True while the connection is deliberately paused because the user is idle.
let paused = false;

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
  if (!paused && !socket.connected) {
    socket.connect();
  }
  return socket;
};

// Idle pause: disconnect but keep the same instance, so every listener that
// components registered stays attached and works again after resume.
export const pauseChatSocket = () => {
  paused = true;
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
};

export const resumeChatSocket = () => {
  paused = false;
  if (socketInstance && !socketInstance.connected) {
    socketInstance.connect();
  }
};

export const disconnectChatSocket = () => {
  paused = false;
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
