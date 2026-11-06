import { useEffect, useState } from "react";
import { LoaderIcon, PauseCircleIcon } from "lucide-react";

import useChatSocket from "../hooks/useChatSocket";
import { useRealtimeStore } from "../store/useRealtimeStore";
import { useTranslation } from "../languages/useTranslation";

// Show "reconnecting" only after a short grace period, so normal connects don't flash it.
const RECONNECT_NOTICE_DELAY_MS = 2000;

// Small status pill for the realtime connection: idle pause or an unexpected disconnect.
const ConnectionStatus = () => {
  const { t } = useTranslation();
  const socket = useChatSocket(true);
  const paused = useRealtimeStore((state) => state.paused);
  const [connected, setConnected] = useState(Boolean(socket?.connected));
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    if (!socket) return undefined;
    const update = () => setConnected(socket.connected);
    update();
    socket.on("connect", update);
    socket.on("disconnect", update);
    socket.on("connect_error", update);
    return () => {
      socket.off("connect", update);
      socket.off("disconnect", update);
      socket.off("connect_error", update);
    };
  }, [socket]);

  useEffect(() => {
    if (connected || paused) {
      setShowReconnecting(false);
      return undefined;
    }
    const timer = setTimeout(() => setShowReconnecting(true), RECONNECT_NOTICE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [connected, paused]);

  if (!paused && !showReconnecting) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full bg-base-300/95 border border-base-content/10 shadow-lg px-4 py-2 text-sm">
        {paused ? (
          <>
            <PauseCircleIcon className="size-4 opacity-70" />
            <span>{t("connection.paused")}</span>
          </>
        ) : (
          <>
            <LoaderIcon className="size-4 animate-spin text-primary" />
            <span>{t("connection.reconnecting")}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
