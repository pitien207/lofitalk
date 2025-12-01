import { useEffect } from "react";
import toast from "react-hot-toast";

import useChatSocket from "../hooks/useChatSocket";
import useNotificationSound from "../hooks/useNotificationSound";
import { useTranslation } from "../languages/useTranslation";
import { useGameInvitesStore } from "../store/useGameInvitesStore";

const isMatchMindPayload = (payload = {}) =>
  !payload.channel || payload.channel === "matchmind";

const GameInviteListener = () => {
  const socket = useChatSocket(true);
  const playNotificationSound = useNotificationSound();
  const { t } = useTranslation();
  const addInvite = useGameInvitesStore((state) => state.addInvite);
  const removeInvite = useGameInvitesStore((state) => state.removeInvite);
  const pruneExpiredInvites = useGameInvitesStore(
    (state) => state.pruneExpiredInvites
  );

  useEffect(() => {
    if (!socket) return undefined;

    const handleMatchMindInvite = (payload = {}) => {
      if (!isMatchMindPayload(payload) || !payload.inviteId) return;
      const isNew = addInvite("matchmind", payload);
      if (!isNew) return;
      toast.success(
        t("matchMind.incomingInvite", {
          name:
            payload.fromUser?.fullName ||
            t("matchMind.answerLabel.friendFallback"),
        })
      );
      playNotificationSound();
    };

    const cleanMatchMindInvite = (payload = {}) => {
      if (!isMatchMindPayload(payload) || !payload.inviteId) return;
      removeInvite("matchmind", payload.inviteId);
    };

    const handleTruthOrLieInvite = (payload = {}) => {
      if (!payload.inviteId) return;
      const isNew = addInvite("truthlie", payload);
      if (!isNew) return;
      toast.success(
        t("truthOrLiar.incomingInvite", {
          name:
            payload.fromUser?.fullName || t("truthOrLiar.friendFallback"),
        })
      );
      playNotificationSound();
    };

    const cleanTruthInvite = (payload = {}) => {
      if (!payload.inviteId) return;
      removeInvite("truthlie", payload.inviteId);
    };

    const events = [
      ["matchmind:invite", handleMatchMindInvite],
      ["matchmind:cancelled", cleanMatchMindInvite],
      ["matchmind:expired", cleanMatchMindInvite],
      ["truthlie:invite", handleTruthOrLieInvite],
      ["truthlie:cancelled", cleanTruthInvite],
      ["truthlie:expired", cleanTruthInvite],
    ];

    events.forEach(([eventName, handler]) => socket.on(eventName, handler));
    return () => {
      events.forEach(([eventName, handler]) => socket.off(eventName, handler));
    };
  }, [socket, addInvite, removeInvite, t, playNotificationSound]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      pruneExpiredInvites("matchmind");
      pruneExpiredInvites("truthlie");
    }, 1000);
    return () => clearInterval(intervalId);
  }, [pruneExpiredInvites]);

  return null;
};

export default GameInviteListener;
