import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  ACTIVITY_EVENTS,
  ACTIVITY_THROTTLE_MS,
  HIDDEN_TAB_DISCONNECT_MS,
  INACTIVITY_DISCONNECT_MS,
} from "../constants/realtime";
import { pauseChatSocket, resumeChatSocket } from "../lib/chatSocket";
import { useRealtimeStore } from "../store/useRealtimeStore";

// Pauses Socket.IO and background polling when the user is away so the backend
// can scale to zero, and resumes (with a full data refresh) when they come back.
const RealtimeIdleManager = () => {
  const queryClient = useQueryClient();
  const setPaused = useRealtimeStore((state) => state.setPaused);

  useEffect(() => {
    let isPaused = false;
    let hiddenTimer = null;
    let inactivityTimer = null;
    let lastActivityAt = 0;

    const pause = () => {
      if (isPaused) return;
      isPaused = true;
      pauseChatSocket();
      setPaused(true);
    };

    const resume = () => {
      if (!isPaused) return;
      isPaused = false;
      setPaused(false);
      resumeChatSocket();
      // Refetch everything currently on screen (messages, threads, unread counts,
      // online users, friend requests, notifications) so nothing missed stays hidden.
      queryClient.invalidateQueries();
    };

    const restartInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(pause, INACTIVITY_DISCONNECT_MS);
    };

    const handleActivity = () => {
      if (document.visibilityState !== "visible") return;
      if (isPaused) resume();

      const now = Date.now();
      if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) return;
      lastActivityAt = now;
      restartInactivityTimer();
    };

    const handleVisibilityChange = () => {
      clearTimeout(hiddenTimer);
      if (document.visibilityState === "hidden") {
        hiddenTimer = setTimeout(pause, HIDDEN_TAB_DISCONNECT_MS);
        return;
      }
      resume();
      restartInactivityTimer();
    };

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, {
        passive: true,
        capture: true,
      })
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    restartInactivityTimer();
    if (document.visibilityState === "hidden") {
      hiddenTimer = setTimeout(pause, HIDDEN_TAB_DISCONNECT_MS);
    }

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity, { capture: true })
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(hiddenTimer);
      clearTimeout(inactivityTimer);
      // Unmount happens on logout; disconnectChatSocket() clears the socket pause flag.
      setPaused(false);
    };
  }, [queryClient, setPaused]);

  return null;
};

export default RealtimeIdleManager;
