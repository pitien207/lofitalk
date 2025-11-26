import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlarmClockIcon,
  BellIcon,
  CheckCircle2Icon,
  Gamepad2Icon,
  LoaderIcon,
  PlayCircleIcon,
  SparklesIcon,
  TimerIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { useTranslation } from "../languages/useTranslation";
import { getUserFriends } from "../lib/api";
import { useMatchMindGame } from "../hooks/useMatchMindGame";
import useAuthUser from "../hooks/useAuthUser";
import useChatSocket from "../hooks/useChatSocket";
import useNotificationSound from "../hooks/useNotificationSound";

const Badge = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-base-200 px-3 py-1 text-sm text-base-content/80">
    <Icon className="size-4 text-primary" />
    {label}
  </span>
);

const MatchMindPage = () => {
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const {
    stage,
    selectedFriend,
    setSelectedFriend,
    inviteRemaining,
    sendInvite,
    inviteId,
    setInviteId,
    startGame,
    startGameFromRemote,
    exitGame,
    cancelInvite,
    questionTimer,
    currentQuestion,
    roundIndex,
    questions,
    currentAnswers,
    chooseAnswer,
    setFriendAnswer,
    history,
    difficulty,
    matches,
    liveScore,
    sessionId,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
  } = useMatchMindGame();
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [isHostSession, setIsHostSession] = useState(false);
  const socket = useChatSocket(true);
  const playNotificationSound = useNotificationSound();

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const eligibleFriends = useMemo(
    () =>
      friends.filter((friend) =>
        ["plus", "admin"].includes(friend?.accountType)
      ),
    [friends]
  );

  const sortedFriends = useMemo(
    () => [...eligibleFriends].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [eligibleFriends]
  );

  const currentQuestionId = currentQuestion?.id;
  const friendLabel = selectedFriend?.fullName || t("matchMind.answerLabel.friendFallback");
  const isInGame = stage === "playing" || stage === "results";
  const isResults = stage === "results";
  const activeSession = sessionId || inviteId;
  const isPlusOrAdmin =
    authUser?.accountType === "plus" || authUser?.accountType === "admin";

  useEffect(() => {
    if (!socket) return;

    const handleInvite = (payload = {}) => {
      if (!payload.inviteId) return;
      setIncomingInvites((prev) => {
        const without = prev.filter((item) => item.inviteId !== payload.inviteId);
        return [...without, payload];
      });
      toast.success(t("matchMind.incomingInvite", { name: payload.fromUser?.fullName || "Friend" }));
      playNotificationSound();
    };

    const handleResponse = (payload = {}) => {
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
          t("matchMind.inviteAccepted", { name: payload.guestName || friendLabel })
        );
      } else {
        if (payload.reason === "expired") {
          markInviteExpired();
          toast.error(t("matchMind.inviteExpired"));
        } else {
          markDeclinedByFriend();
          toast.error(
            t("matchMind.inviteDeclined", { name: payload.guestName || friendLabel })
          );
        }
        setIsHostSession(false);
      }
    };

    const handleStart = (payload = {}) => {
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
      if (!payload.inviteId || payload.inviteId !== activeSession) return;
      if (!payload.answer) return;
      setFriendAnswer(payload.answer);
    };

    const handleCancelled = (payload = {}) => {
      if (!payload.inviteId) return;
      setIncomingInvites((prev) =>
        prev.filter((invite) => invite.inviteId !== payload.inviteId)
      );
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
      if (!payload.inviteId) return;
      setIncomingInvites((prev) =>
        prev.filter((invite) => invite.inviteId !== payload.inviteId)
      );
      if (payload.inviteId === inviteId) {
        markInviteExpired();
        setIsHostSession(false);
      }
    };

    socket.on("matchmind:invite", handleInvite);
    socket.on("matchmind:response", handleResponse);
    socket.on("matchmind:start", handleStart);
    socket.on("matchmind:answer", handleAnswer);
    socket.on("matchmind:expired", handleExpired);
    socket.on("matchmind:cancelled", handleCancelled);

    return () => {
      socket.off("matchmind:invite", handleInvite);
      socket.off("matchmind:response", handleResponse);
      socket.off("matchmind:start", handleStart);
      socket.off("matchmind:answer", handleAnswer);
      socket.off("matchmind:expired", handleExpired);
      socket.off("matchmind:cancelled", handleCancelled);
    };
  }, [
    socket,
    inviteId,
    activeSession,
    selectedFriend,
    stage,
    startGameFromRemote,
    setFriendAnswer,
    setSelectedFriend,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
    cancelInvite,
    friendLabel,
    setInviteId,
    t,
  ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIncomingInvites((prev) =>
        prev.filter((invite) => (invite.expiresAt || 0) > Date.now())
      );
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (stage === "expired" || stage === "lobby" || stage === "declined") {
      setIsHostSession(false);
    }
  }, [stage]);

  const handleSelectFriend = (event) => {
    const selectedId = event.target.value;
    const friend = sortedFriends.find((item) => item._id === selectedId);
    setSelectedFriend(friend || null);
  };

  const difficultyLabel =
    difficulty === "hard"
      ? t("matchMind.hardMode")
      : t("matchMind.easyMode");

  const handleIncomingRespond = (invite, accepted) => {
    if (!socket) {
      toast.error("Connecting to game server. Try again in a moment.");
      return;
    }
    socket.emit(
      "matchmind:respond",
      { inviteId: invite.inviteId, accepted },
      (response = {}) => {
        if (response.error) {
          toast.error(response.error);
          setIncomingInvites((prev) =>
            prev.filter((item) => item.inviteId !== invite.inviteId)
          );
          return;
        }
        setIncomingInvites((prev) =>
          prev.filter((item) => item.inviteId !== invite.inviteId)
        );
        setInviteId(invite.inviteId);
        setSelectedFriend(invite.fromUser);

        if (accepted) {
          setIsHostSession(false);
          markAcceptedByFriend();
          toast.success(t("matchMind.incomingAccepted", { name: invite.fromUser.fullName }));
        } else {
          markDeclinedByFriend();
        }
      }
    );
  };

  const handleSendInvite = () => {
    if (!selectedFriend) {
      toast.error("Pick a friend to send the invite.");
      return;
    }
    if (!socket) {
      toast.error("Connecting to game server. Try again in a moment.");
      return;
    }

    socket.emit(
      "matchmind:invite",
      { toUserId: selectedFriend._id },
      (response = {}) => {
        if (response.error) {
          toast.error(response.error);
          return;
        }
        sendInvite({ inviteId: response.inviteId, expiresAt: response.expiresAt });
        setIsHostSession(true);
        toast.success(t("matchMind.inviteSent", { name: friendLabel }));
      }
    );
  };

  const handleStartGame = (mode) => {
    if (stage !== "accepted") {
      toast.error("Wait until your friend accepts the invite.");
      return;
    }
    startGame(mode);
    if (socket && inviteId) {
      socket.emit("matchmind:start", { inviteId, difficulty: mode });
    }
  };

  const handleChooseAnswer = useCallback(
    (option) => {
      chooseAnswer(option);
      const session = sessionId || inviteId;
      if (socket && session && currentQuestionId) {
        socket.emit("matchmind:answer", {
          inviteId: session,
          questionId: currentQuestionId,
          answer: option,
        });
      }
    },
    [chooseAnswer, socket, sessionId, inviteId, currentQuestionId]
  );

  const handleCancelInvite = () => {
    if (socket && inviteId && isHostSession) {
      socket.emit("matchmind:cancel", { inviteId }, (response = {}) => {
        if (response.error) {
          toast.error(response.error);
        }
      });
    }
    cancelInvite();
    setIsHostSession(false);
  };

  const handleExitGame = () => {
    exitGame();
    setIsHostSession(false);
  };

  const renderProgressDots = () => (
    <div className="flex items-center gap-1">
      {questions.map((question, idx) => {
        const answered = history[idx];
        const isCurrent = idx === roundIndex && stage === "playing";
        const matched = answered?.matched;

        let color = "bg-base-300";
        if (matched) color = "bg-success";
        else if (answered && !matched) color = "bg-warning";
        else if (isCurrent) color = "bg-primary/60 animate-pulse";

        return <span key={question.id} className={`h-2 w-6 rounded-full ${color}`} />;
      })}
    </div>
  );

  const renderGameView = () => (
    <div className="w-full">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">MatchMind</p>
            <h1 className="text-3xl font-bold text-base-content">
              {isResults ? t("matchMind.resultsTitle") : t("matchMind.gameTitle")}
            </h1>
            {!isResults && (
              <p className="text-sm text-base-content/70">
                {t("matchMind.questionCounter", {
                  index: Math.min(roundIndex + 1, questions.length),
                  total: questions.length,
                })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-outline">
              {t("matchMind.sharedScore")}: {isResults ? matches : liveScore}/{questions.length}
            </span>
            {!isResults && (
              <span className="badge badge-primary badge-lg gap-2">
                <TimerIcon className="size-4" />
                {questionTimer}s
              </span>
            )}
            <span className="badge badge-ghost gap-1">
              <UsersIcon className="size-4" />
              {authUser?.fullName || "You"} & {friendLabel}
            </span>
          </div>
        </div>

        {isResults ? (
          <div className="rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow space-y-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                {t("matchMind.resultsTitle")}
              </p>
              <h2 className="text-3xl font-bold text-base-content">
                {t("matchMind.resultsDescription")}
              </h2>
              <p className="text-base text-base-content/70">{t("matchMind.liveOnly")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-base-content/80">
                <CheckCircle2Icon className="size-5 text-success" />
                <span>
                  {t("matchMind.sharedScore")}: {matches}/{questions.length}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={handleExitGame}>
                  {t("matchMind.playAgain")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  {t("matchMind.questionCounter", {
                    index: Math.min(roundIndex + 1, questions.length),
                    total: questions.length,
                  })}
                </p>
                <h2 className="text-2xl font-semibold text-base-content">
                  {currentQuestion?.prompt}
                </h2>
                <p className="text-sm text-base-content/70">
                  {t("matchMind.timePerQuestion")}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-base-200 px-3 py-1 text-sm">
                <SparklesIcon className="size-4 text-primary" />
                <span>
                  {authUser?.fullName || "You"} vs {friendLabel}
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {currentQuestion?.options.map((option, idx) => {
                const isSelected = currentAnswers.yours === option;

                return (
                  <button
                    key={option}
                    onClick={() => handleChooseAnswer(option)}
                    disabled={Boolean(currentAnswers.yours)}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-base-200 bg-base-100 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-base-200 text-sm font-semibold">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="font-semibold">{option}</p>
                        <p className="text-xs text-base-content/60">
                          {isSelected ? t("matchMind.answerLabel.you") : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-200 bg-base-100/80 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <AlarmClockIcon className="size-4" />
                <span>
                  {currentAnswers.friend
                    ? t("matchMind.friendLocked")
                    : t("matchMind.waitingFriend")}
                </span>
              </div>
              {renderProgressDots()}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isInGame) {
    return renderGameView();
  }

  const steps = Array.isArray(t("matchMind.steps")) ? t("matchMind.steps") : [];

  if (!isPlusOrAdmin) {
    return (
      <div className="w-full">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
          <section className="rounded-3xl border border-base-300 bg-base-100/80 p-8 shadow-xl text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              MatchMind
            </p>
            <h1 className="text-4xl font-bold text-base-content">
              {t("matchMind.comingSoonTitle")}
            </h1>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <section className="rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                MatchMind
              </p>
              <h1 className="text-4xl font-bold text-base-content">{t("matchMind.title")}</h1>
              <p className="text-base text-base-content/70">{t("matchMind.subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge icon={Gamepad2Icon} label="10 questions" />
              <Badge icon={TimerIcon} label={t("matchMind.timePerQuestion")} />
              <Badge icon={CheckCircle2Icon} label="Score = matching answers" />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100/80 p-5 shadow">
            <div className="flex items-center gap-2">
              <BellIcon className="size-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-base-content">
                  {t("matchMind.inviteTitle")}
                </h3>
                <p className="text-sm text-base-content/70">
                  {t("matchMind.inviteDescription")}
                </p>
              </div>
            </div>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text text-sm">{t("matchMind.friendListLabel")}</span>
              </div>
              <select
                className="select select-bordered w-full"
                onChange={handleSelectFriend}
                value={selectedFriend?._id || ""}
                disabled={loadingFriends}
              >
                <option value="">
                  {loadingFriends
                    ? t("matchMind.loadingFriends")
                    : t("matchMind.selectFriendPlaceholder")}
                </option>
                {sortedFriends.map((friend) => (
                  <option key={friend._id} value={friend._id}>
                    {friend.fullName}
                  </option>
                ))}
              </select>
              {loadingFriends && (
                <span className="mt-2 inline-flex items-center gap-2 text-xs text-base-content/60">
                  <LoaderIcon className="size-4 animate-spin" />
                  {t("matchMind.loadingFriends")}
                </span>
              )}
              {!loadingFriends && sortedFriends.length === 0 && (
                <span className="mt-2 text-xs text-base-content/60">
                  {t("matchMind.noFriends")}
                </span>
              )}
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-primary flex-1"
                onClick={handleSendInvite}
                disabled={!selectedFriend || stage === "inviting"}
              >
                <PlayCircleIcon className="size-4" />
                {t("matchMind.sendInvite")}
              </button>
              <button className="btn btn-ghost" onClick={handleCancelInvite}>
                {t("matchMind.cancel")}
              </button>
            </div>

            {stage === "inviting" && (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TimerIcon className="size-4" />
                <span>
                  {t("matchMind.inviteCountdown", {
                    seconds: inviteRemaining,
                  })}
                </span>
              </div>
                <p className="text-warning/80">
                  {t("matchMind.waitingResponse")}
                </p>
              </div>
            )}

            {stage === "accepted" && (
              <div className="flex flex-col gap-2 rounded-2xl border border-success/40 bg-success/10 p-3 text-success">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-5" />
                  <span>
                    {t("matchMind.inviteAccepted", {
                      name: friendLabel,
                    })}
                  </span>
                </div>
                {isHostSession ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-success/80">
                      {t("matchMind.selectDifficulty")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        className="btn btn-success w-full"
                        onClick={() => handleStartGame("easy")}
                      >
                        {t("matchMind.startEasy")}
                      </button>
                      <button
                        className="btn btn-outline btn-success w-full border-success/60"
                        onClick={() => handleStartGame("hard")}
                      >
                        {t("matchMind.startHard")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-success/80">
                    {t("matchMind.waitingHost")}
                  </p>
                )}
              </div>
            )}

            {stage === "declined" && (
              <div className="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error">
                {t("matchMind.inviteDeclined", { name: friendLabel })}
              </div>
            )}

            {stage === "expired" && (
              <div className="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/70">
                {t("matchMind.inviteExpired")}
              </div>
            )}

            {incomingInvites.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-info/40 bg-info/10 p-3">
                <div className="flex items-center gap-2 text-info">
                  <BellIcon className="size-4" />
                  <span className="text-sm font-semibold">
                    {t("matchMind.incomingTitle")}
                  </span>
                </div>
                {incomingInvites.map((invite) => {
                  const secondsLeft = Math.max(
                    0,
                    Math.ceil(((invite.expiresAt || 0) - Date.now()) / 1000)
                  );
                  return (
                    <div
                      key={invite.inviteId}
                      className="rounded-xl border border-info/40 bg-base-100/80 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-base-content">
                            {invite.fromUser?.fullName || t("matchMind.answerLabel.friendFallback")}
                          </p>
                          <p className="text-xs text-base-content/60">
                            {t("matchMind.incomingSubtitle")}
                          </p>
                        </div>
                        <span className="badge badge-outline">{secondsLeft}s</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-success btn-sm flex-1"
                          onClick={() => handleIncomingRespond(invite, true)}
                        >
                          {t("matchMind.acceptInvite")}
                        </button>
                        <button
                          className="btn btn-outline btn-sm flex-1"
                          onClick={() => handleIncomingRespond(invite, false)}
                        >
                          {t("matchMind.declineInvite")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="lg:col-span-2 space-y-4 rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow">
            <div className="flex items-center gap-2 text-base-content">
              <SparklesIcon className="size-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t("matchMind.howItWorksTitle")}</h2>
                <p className="text-sm text-base-content/70">{t("matchMind.liveOnly")}</p>
              </div>
            </div>
            <div className="grid gap-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-2xl border border-base-200 bg-base-100/90 p-4"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base text-base-content/80">{step}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MatchMindPage;
