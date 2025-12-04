import { useEffect } from "react";
import toast from "react-hot-toast";

import useChatSocket from "../hooks/useChatSocket";
import { useMatchMindGame } from "../hooks/useMatchMindGame.jsx";
import { useGameInvitesStore } from "../store/useGameInvitesStore";
import { useTranslation } from "../languages/useTranslation";

const isMatchMindPayload = (payload = {}) =>
  !payload.channel || payload.channel === "matchmind";

const MatchMindSocketBridge = () => {
  const socket = useChatSocket(true);
  const { t } = useTranslation();
  const {
    stage,
    selectedFriend,
    setSelectedFriend,
    inviteId,
    setInviteId,
    startGameFromRemote,
    setFriendAnswer,
    activeSession,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
    cancelInvite,
    exitGame,
    setSharedAnswers,
    setIsHostSession,
  } = useMatchMindGame();
  const removeMatchMindInvite = useGameInvitesStore((state) => state.removeInvite);
  const clearMatchMindInvites = useGameInvitesStore((state) => state.clearInvites);

  useEffect(() => {
    if (!socket) return undefined;

    const friendLabel =
      selectedFriend?.fullName || t("matchMind.answerLabel.friendFallback");

    const handleResponse = (payload = {}) => {
      if (!isMatchMindPayload(payload)) return;
      if (!payload.inviteId || payload.inviteId !== inviteId) return;

      if (payload.accepted) {
        if (!selectedFriend && payload.guestId) {
          setSelectedFriend({
            _id: payload.guestId,
            fullName: payload.guestName,
            profilePic: payload.guestPic,
          });
        }
        markAcceptedByFriend();
        toast.success(
          t("matchMind.inviteAccepted", {
            name: payload.guestName || friendLabel,
          })
        );
      } else {
        if (payload.reason === "expired") {
          markInviteExpired();
          toast.error(t("matchMind.inviteExpired"));
        } else {
          markDeclinedByFriend();
          toast.error(
            t("matchMind.inviteDeclined", {
              name: payload.guestName || friendLabel,
            })
          );
        }
        setIsHostSession(false);
      }
    };

    const handleStart = (payload = {}) => {
      if (!isMatchMindPayload(payload)) return;
      if (!payload.inviteId) return;
      if (activeSession && payload.inviteId !== activeSession) return;

      if (!selectedFriend?._id && payload.hostId) {
        setSelectedFriend({
          _id: payload.hostId,
          fullName: payload.hostName || friendLabel,
          profilePic: payload.hostPic,
        });
      }

      if (stage === "playing" && activeSession === payload.inviteId) return;

      setInviteId(payload.inviteId);
      startGameFromRemote(payload.inviteId, payload.difficulty);
      toast.success(t("matchMind.gameStarting"));
    };

    const handleAnswer = (payload = {}) => {
      if (!isMatchMindPayload(payload)) return;
      if (!payload.inviteId || payload.inviteId !== activeSession) return;
      if (!payload.answer) return;
      setFriendAnswer(payload.answer);
    };

    const handleShareAnswersEvent = (payload = {}) => {
      if (!isMatchMindPayload(payload)) return;
      if (!payload.inviteId || payload.inviteId !== activeSession) return;
      setSharedAnswers({
        fromUser: payload.fromUser,
        history: Array.isArray(payload.history) ? payload.history : [],
      });
      toast.success(
        t("matchMind.shareAnswersReceivedToast", {
          name: payload.fromUser?.fullName || friendLabel,
        })
      );
    };

    const handleCancelled = (payload = {}) => {
      if (!isMatchMindPayload(payload)) return;
      if (!payload.inviteId) return;
      removeMatchMindInvite("matchmind", payload.inviteId);
      if (payload.inviteId === inviteId) {
        cancelInvite();
        setIsHostSession(false);
        toast.error(
          t("matchMind.inviteCanceled", {
            name: payload.hostName || friendLabel,
          })
        );
      } else {
        toast.error(
          t("matchMind.inviteCanceled", {
            name: payload.hostName || friendLabel,
          })
        );
      }
    };

    const handleExpired = (payload = {}) => {
      if (!isMatchMindPayload(payload)) return;
      if (!payload.inviteId) return;
      removeMatchMindInvite("matchmind", payload.inviteId);
      if (payload.inviteId === inviteId) {
        markInviteExpired();
        setIsHostSession(false);
      }
    };

    const handleExitBoth = (payload = {}) => {
      if (!payload.inviteId || payload.inviteId !== activeSession) return;
      exitGame();
      setIsHostSession(false);
      setInviteId(null);
      clearMatchMindInvites("matchmind");
      toast.error(t("matchMind.gameEnded"));
    };

    socket.on("matchmind:response", handleResponse);
    socket.on("matchmind:start", handleStart);
    socket.on("matchmind:answer", handleAnswer);
    socket.on("matchmind:share-answers", handleShareAnswersEvent);
    socket.on("matchmind:expired", handleExpired);
    socket.on("matchmind:cancelled", handleCancelled);
    socket.on("matchmind:exit", handleExitBoth);

    return () => {
      socket.off("matchmind:response", handleResponse);
      socket.off("matchmind:start", handleStart);
      socket.off("matchmind:answer", handleAnswer);
      socket.off("matchmind:share-answers", handleShareAnswersEvent);
      socket.off("matchmind:expired", handleExpired);
      socket.off("matchmind:cancelled", handleCancelled);
      socket.off("matchmind:exit", handleExitBoth);
    };
  }, [
    socket,
    t,
    selectedFriend,
    inviteId,
    activeSession,
    stage,
    startGameFromRemote,
    setInviteId,
    setFriendAnswer,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
    cancelInvite,
    exitGame,
    setSharedAnswers,
    setSelectedFriend,
    removeMatchMindInvite,
    clearMatchMindInvites,
    setIsHostSession,
  ]);

  return null;
};

export default MatchMindSocketBridge;
