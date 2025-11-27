import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BellIcon,
  CheckCircle2Icon,
  Gamepad2Icon,
  ListChecksIcon,
  LoaderIcon,
  PenLineIcon,
  PlayCircleIcon,
  SparklesIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { useTranslation } from "../languages/useTranslation";
import { getUserFriends } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import useChatSocket from "../hooks/useChatSocket";
import useNotificationSound from "../hooks/useNotificationSound";
import { useTruthOrLieGame } from "../hooks/useTruthOrLieGame";

const Badge = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-base-200 px-3 py-1 text-sm text-base-content/80">
    <Icon className="size-4 text-primary" />
    {label}
  </span>
);

const QuestionEditor = ({
  question,
  index,
  onPromptChange,
  onOptionChange,
  onLieChange,
  t,
}) => (
  <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4 shadow-sm space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="badge badge-primary badge-outline">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-semibold text-base-content">
          {t("truthOrLiar.questionLabel", { index: index + 1 })}
        </span>
      </div>
      <span className="text-xs text-base-content/60 flex items-center gap-1">
        <SparklesIcon className="size-4 text-warning" />
        {t("truthOrLiar.lieMarkHint")}
      </span>
    </div>

    <label className="form-control">
      <div className="label">
        <span className="label-text text-sm">{t("truthOrLiar.promptLabel")}</span>
      </div>
      <input
        type="text"
        className="input input-bordered w-full"
        value={question.prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={t("truthOrLiar.promptPlaceholder")}
      />
    </label>

    <div className="grid gap-3 sm:grid-cols-3">
      {question.options.map((option, optIdx) => (
        <div
          key={`${question.id}-${optIdx}`}
          className={`rounded-xl border p-3 ${
            question.lieIndex === optIdx
              ? "border-warning/60 bg-warning/5"
              : "border-base-200 bg-base-100"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-base-content/90">
              {t("truthOrLiar.statementLabel", { index: optIdx + 1 })}
            </span>
            <label className="flex items-center gap-1 text-xs text-base-content/60 cursor-pointer">
              <input
                type="radio"
                name={`lie-${question.id}`}
                className="radio radio-warning radio-xs"
                checked={question.lieIndex === optIdx}
                onChange={() => onLieChange(optIdx)}
              />
              {t("truthOrLiar.lieMarkLabel")}
            </label>
          </div>
          <input
            type="text"
            className="input input-bordered input-sm w-full mt-2"
            value={option}
            onChange={(e) => onOptionChange(optIdx, e.target.value)}
            placeholder={t("truthOrLiar.statementPlaceholder", { index: optIdx + 1 })}
          />
        </div>
      ))}
    </div>
  </div>
);

const TruthOrLiePage = () => {
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const socket = useChatSocket(true);
  const playNotificationSound = useNotificationSound();

  const {
    stage,
    mode,
    setMode,
    questionCount,
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
    setFriendAnswer,
    chooseAnswer,
    currentQuestion,
    roundIndex,
    questions,
    updateQuestionPrompt,
    updateQuestionOption,
    setLieIndex,
    answers,
    isDeckReady,
    sessionId,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
  } = useTruthOrLieGame();

  const [incomingInvites, setIncomingInvites] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("truthlie-incoming");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
  const [isHostSession, setIsHostSession] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("truthlie-is-host") === "true";
  });
  const isPlusOrAdmin =
    authUser?.accountType === "plus" || authUser?.accountType === "admin";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("truthlie-incoming", JSON.stringify(incomingInvites));
  }, [incomingInvites]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("truthlie-is-host", isHostSession ? "true" : "false");
  }, [isHostSession]);

  const friendLabel = selectedFriend?.fullName || t("truthOrLiar.friendFallback");
  const activeSession = sessionId || inviteId;
  const isInSession = stage === "playing" || stage === "review";
  const yourAnswers = answers?.yours || {};
  const friendAnswers = answers?.friend || {};
  const nextFriendIndex = questions.findIndex(
    (q) => friendAnswers[q.id] === undefined
  );
  const answeredCount = isHostSession
    ? Object.keys(friendAnswers).length
    : Object.keys(yourAnswers).length;
  const displayIndex = isHostSession
    ? nextFriendIndex >= 0
      ? nextFriendIndex
      : questions.length - 1
    : Math.min(
        questions.findIndex((q) => yourAnswers[q.id] === undefined) >= 0
          ? questions.findIndex((q) => yourAnswers[q.id] === undefined)
          : questions.length - 1,
        questions.length - 1
      );
  const displayQuestion = questions[displayIndex] || currentQuestion || questions[0];
  const modeBadge =
    mode === "long"
      ? t("truthOrLiar.modeBadgeLong")
      : t("truthOrLiar.modeBadgeShort");

  useEffect(() => {
    if (!socket) return undefined;

    const handleInvite = (payload = {}) => {
      const incomingId = payload.inviteId || payload.id;
      if (!incomingId) return;
      setIncomingInvites((prev) => {
        const without = prev.filter((item) => item.inviteId !== incomingId);
        return [...without, { ...payload, inviteId: incomingId }];
      });
      toast.success(
        t("truthOrLiar.incomingInvite", {
          name: payload.fromUser?.fullName || t("truthOrLiar.friendFallback"),
        })
      );
      playNotificationSound();
    };

    const handleResponse = (payload = {}) => {
      const responseId = payload.inviteId || payload.id;
      if (!responseId || responseId !== inviteId) return;

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
          t("truthOrLiar.inviteAccepted", { name: payload.guestName || friendLabel })
        );
      } else {
        if (payload.reason === "expired") {
          markInviteExpired();
          toast.error(t("truthOrLiar.inviteExpired"));
        } else {
          markDeclinedByFriend();
          toast.error(
            t("truthOrLiar.inviteDeclined", { name: payload.guestName || friendLabel })
          );
        }
        setIsHostSession(false);
      }
    };

    const handleStart = (payload = {}) => {
      const startId = payload.inviteId || payload.id;
      if (!startId) return;
      if (activeSession && startId !== activeSession) return;

      if (!selectedFriend?._id && payload.hostId) {
        setSelectedFriend({
          _id: payload.hostId,
          fullName: payload.hostName || friendLabel,
          profilePic: payload.hostPic,
        });
      }

      if (stage === "playing" && activeSession === startId) return;

      const payloadQuestions =
        (Array.isArray(payload.questions) && payload.questions) ||
        (Array.isArray(payload.deck) && payload.deck) ||
        (Array.isArray(payload.questionSet) && payload.questionSet) ||
        (payload.data && Array.isArray(payload.data.questions) && payload.data.questions) ||
        [];

      setInviteId(startId);
      startGameFromRemote(startId, payload.mode || payload.difficulty, payloadQuestions);
      toast.success(t("truthOrLiar.gameStarting"));
    };

    const handleDeck = (payload = {}) => {
      const deckId = payload.inviteId || payload.id;
      if (!deckId) return;
      const payloadQuestions =
        (Array.isArray(payload.questions) && payload.questions) ||
        (Array.isArray(payload.deck) && payload.deck) ||
        (Array.isArray(payload.questionSet) && payload.questionSet) ||
        (payload.data && Array.isArray(payload.data.questions) && payload.data.questions) ||
        [];
      if (payloadQuestions.length === 0) return;
      setInviteId(deckId);
      startGameFromRemote(deckId, payload.mode || payload.difficulty, payloadQuestions);
    };

    const handleAnswer = (payload = {}) => {
      const answerId = payload.inviteId || payload.id;
      if (!answerId || answerId !== activeSession) return;
      if (!payload.questionId && payload.questionId !== 0) return;
      const answerVal = payload.choice ?? payload.answer;
      if (answerVal === undefined || answerVal === null) return;
      setFriendAnswer(payload.questionId, answerVal);
    };

    const handleCancelled = (payload = {}) => {
      const cancelId = payload.inviteId || payload.id;
      if (!cancelId) return;
      setIncomingInvites((prev) =>
        prev.filter((invite) => invite.inviteId !== cancelId)
      );
      if (cancelId === inviteId || isInSession) {
        exitGame();
        setIsHostSession(false);
        setInviteId(null);
        toast.error(t("truthOrLiar.gameEnded"));
      }
    };

    const handleExpired = (payload = {}) => {
      const expireId = payload.inviteId || payload.id;
      if (!expireId) return;
      setIncomingInvites((prev) =>
        prev.filter((invite) => invite.inviteId !== expireId)
      );
      if (expireId === inviteId) {
        markInviteExpired();
        setIsHostSession(false);
      }
    };

    const handleExitBoth = () => {
      exitGame();
      setIsHostSession(false);
      setInviteId(null);
      setIncomingInvites([]);
      toast.error(t("truthOrLiar.gameEnded"));
    };

    const events = [
      ["truthlie:invite", handleInvite],
      ["truthlie:response", handleResponse],
      ["truthlie:start", handleStart],
      ["truthlie:deck", handleDeck],
      ["truthlie:answer", handleAnswer],
      ["truthlie:expired", handleExpired],
      ["truthlie:cancelled", handleCancelled],
      ["truthlie:cancel", handleCancelled],
      ["truthlie:exit", handleExitBoth],
    ];

    events.forEach(([evt, handler]) => socket.on(evt, handler));

    return () => {
      events.forEach(([evt, handler]) => socket.off(evt, handler));
    };
  }, [
    socket,
    inviteId,
    activeSession,
    selectedFriend,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
    cancelInvite,
    friendLabel,
    setSelectedFriend,
    startGameFromRemote,
    t,
    setFriendAnswer,
    setInviteId,
    playNotificationSound,
    stage,
    exitGame,
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
    if (stage === "lobby" || stage === "expired" || stage === "declined") {
      setIsHostSession(false);
    }
  }, [stage]);

  const handleSelectFriend = (event) => {
    const selectedId = event.target.value;
    const friend = sortedFriends.find((item) => item._id === selectedId);
    setSelectedFriend(friend || null);
  };

  const handleIncomingRespond = (invite, accepted) => {
    if (!socket) {
      toast.error("Connecting to game server. Try again in a moment.");
      return;
    }
    const payload = { inviteId: invite.inviteId || invite.id, accepted };
    let handled = false;
    const onResponse = (response = {}) => {
      if (handled) return;
      handled = true;
      if (response.error) {
        toast.error(response.error);
        setIncomingInvites((prev) =>
          prev.filter((item) => (item.inviteId || item.id) !== (invite.inviteId || invite.id))
        );
        return;
      }
      setIncomingInvites((prev) =>
        prev.filter((item) => (item.inviteId || item.id) !== (invite.inviteId || invite.id))
      );
      setInviteId(invite.inviteId || invite.id);
      setSelectedFriend(invite.fromUser);
      setIsHostSession(false);

      if (accepted) {
        markAcceptedByFriend();
        toast.success(t("truthOrLiar.incomingAccepted", { name: invite.fromUser.fullName }));
      } else {
        markDeclinedByFriend();
      }
    };

    socket.emit("truthlie:respond", payload, onResponse);
  };

  const handleSendInvite = () => {
    if (!isPlusOrAdmin) {
      toast.error(t("truthOrLiar.plusOnly"));
      return;
    }
    if (!selectedFriend) {
      toast.error(t("truthOrLiar.needFriend"));
      return;
    }
    if (!socket) {
      toast.error("Connecting to game server. Try again in a moment.");
      return;
    }

    const payload = { toUserId: selectedFriend._id };
    let handled = false;
    const onResponse = (response = {}) => {
      if (handled) return;
      handled = true;
      if (response.error) {
        toast.error(response.error);
        return;
      }
      const inviteKey = response.inviteId || response.id;
      if (!inviteKey) {
        toast.error(t("truthOrLiar.inviteSendFailed"));
        return;
      }
      sendInvite({ inviteId: inviteKey, expiresAt: response.expiresAt });
      setIsHostSession(true);
      toast.success(t("truthOrLiar.inviteSent", { name: friendLabel }));
    };

    socket.emit("truthlie:invite", payload, onResponse);
  };

  const handleStartGame = () => {
    if (!isHostSession || stage !== "accepted") {
      toast.error(t("truthOrLiar.waitingHost"));
      return;
    }
    if (!isDeckReady) {
      toast.error(t("truthOrLiar.deckIncomplete"));
      return;
    }
    startGame(mode, questions);
    if (socket && inviteId) {
      const payload = {
        inviteId,
        mode,
        questions,
        deck: questions,
        questionSet: questions,
      };
      const onResponse = (response = {}) => {
        if (response.error) {
          toast.error(response.error);
        }
      };
      socket.emit("truthlie:start", payload, onResponse);
      socket.emit("truthlie:deck", payload);
    }
  };

  const handleChooseAnswer = useCallback(
    (optionIndex) => {
      if (isHostSession) return;
      chooseAnswer(optionIndex);
      const session = sessionId || inviteId;
      const questionId = currentQuestion?.id;
      if (socket && session && questionId) {
        const payload = {
          inviteId: session,
          questionId,
          answer: optionIndex,
        };
        socket.emit("truthlie:answer", payload);
      }
    },
    [chooseAnswer, socket, sessionId, inviteId, currentQuestion, isHostSession]
  );

  const handleCancelInvite = () => {
    if (socket && inviteId && isHostSession) {
      const payload = { inviteId };
      const onResponse = (response = {}) => {
        if (response.error) {
          toast.error(response.error);
        }
      };
      socket.emit("truthlie:cancel", payload, onResponse);
    }
    cancelInvite();
    setIsHostSession(false);
  };

  const handleExitGame = () => {
    if (socket && (sessionId || inviteId)) {
      const payload = { inviteId: sessionId || inviteId };
      ["truthlie:exit", "truthlie:cancel"].forEach((eventName) =>
        socket.emit(eventName, payload)
      );
    }
    exitGame();
    setIsHostSession(false);
    setIncomingInvites([]);
  };

  const renderResultList = (isHostView) => {
    const pickLabel = isHostView
      ? t("truthOrLiar.friendLabel", { name: friendLabel })
      : t("truthOrLiar.youLabel");

    return (
      <div className="space-y-4">
        {questions.map((question, idx) => {
          const pickIndex = isHostView
            ? friendAnswers[question.id]
            : yourAnswers[question.id];
          return (
            <div
              key={question.id}
              className="rounded-2xl border border-base-300 bg-base-100/80 p-4 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-outline">
                    {t("truthOrLiar.questionLabel", { index: idx + 1 })}
                  </span>
                  <h3 className="font-semibold text-base-content">{question.prompt}</h3>
                </div>
                <span className="badge badge-ghost">{pickLabel}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {question.options.map((option, optIdx) => {
                  const isLie = question.lieIndex === optIdx;
                  const isPicked = pickIndex === optIdx;
                  return (
                    <div
                      key={`${question.id}-${optIdx}`}
                      className={`rounded-xl border p-3 text-sm transition ${
                        isPicked
                          ? "border-primary bg-primary/10"
                          : "border-base-200 bg-base-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-base-content">{option}</span>
                        <div className="flex items-center gap-1">
                          {isLie && (
                            <span className="badge badge-warning badge-sm text-xs">
                              {t("truthOrLiar.lieTag")}
                            </span>
                          )}
                          {!isLie && (
                            <span className="badge badge-ghost badge-sm text-xs">
                              {t("truthOrLiar.truthTag")}
                            </span>
                          )}
                          {isPicked && (
                            <span className="badge badge-primary badge-sm text-xs">
                              {pickLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSessionView = () => {
    const question = displayQuestion;
    const alreadyPicked =
      question && yourAnswers[question.id] !== undefined && !isHostSession;
    const answeredLabel = t("truthOrLiar.answeredCount", {
      count: answeredCount,
      total: questionCount,
    });

    return (
      <div className="w-full">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Truth or Lie
              </p>
              <h1 className="text-3xl font-bold text-base-content">
                {stage === "review"
                  ? t("truthOrLiar.resultsHeader")
                  : t("truthOrLiar.title")}
              </h1>
              <p className="text-sm text-base-content/70">
                {t("truthOrLiar.questionCounter", {
                  index: Math.min(
                    isHostSession
                      ? nextFriendIndex >= 0
                        ? nextFriendIndex + 1
                        : questionCount
                      : roundIndex + 1,
                    questionCount
                  ),
                  total: questionCount,
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-outline">{modeBadge}</span>
              <span className="badge badge-ghost gap-1">
                <UsersIcon className="size-4" />
                {authUser?.fullName || "You"} & {friendLabel}
              </span>
              <span className="badge badge-primary badge-outline gap-1">
                <CheckCircle2Icon className="size-4" />
                {answeredLabel}
              </span>
            </div>
          </div>

          {stage === "review" ? (
            <div className="rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  {t("truthOrLiar.reviewTitle")}
                </p>
                <h2 className="text-2xl font-semibold text-base-content">
                  {isHostSession
                    ? t("truthOrLiar.reviewDescriptionHost")
                    : t("truthOrLiar.reviewDescriptionGuest")}
                </h2>
              </div>
              {renderResultList(isHostSession)}
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={handleExitGame}>
                  {t("truthOrLiar.exitGame")}
                </button>
              </div>
            </div>
          ) : isHostSession ? (
            <div className="rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow space-y-4">
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <SparklesIcon className="size-4 text-primary" />
                <span>{t("truthOrLiar.waitingFriendChoice")}</span>
              </div>
              {renderResultList(true)}
              <div className="flex justify-end">
                <button className="btn btn-ghost" onClick={handleExitGame}>
                  {t("truthOrLiar.exitGame")}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-primary">
                    {t("truthOrLiar.questionCounter", {
                      index: Math.min(displayIndex + 1, questionCount),
                      total: questionCount,
                    })}
                  </p>
                  <h2 className="text-2xl font-semibold text-base-content">
                    {displayQuestion?.prompt}
                  </h2>
                  <p className="text-sm text-base-content/70">
                    {t("truthOrLiar.pickLiePrompt")}
                  </p>
                </div>
                <div className="badge badge-outline badge-lg">{modeBadge}</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {displayQuestion?.options.map((option, idx) => {
                  const isSelected = yourAnswers[displayQuestion.id] === idx;
                  return (
                    <button
                      key={`${displayQuestion.id}-${idx}`}
                      onClick={() => handleChooseAnswer(idx)}
                      disabled={alreadyPicked || isHostSession}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-base-200 bg-base-100 hover:border-primary/50"
                      } ${alreadyPicked || isHostSession ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-base-200 text-sm font-semibold">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="font-semibold">{option}</p>
                          {isSelected && (
                            <p className="text-xs text-base-content/60">
                              {t("truthOrLiar.youLabel")}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2Icon className="size-5 text-primary" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-200 bg-base-100/80 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <TimerIcon className="size-4" />
                <span>
                  {isHostSession
                    ? t("truthOrLiar.answeredCount", {
                        count: Object.keys(friendAnswers).length,
                        total: questionCount,
                      })
                    : answeredLabel}
                </span>
              </div>
              <span className="text-sm text-base-content/70">
                {isHostSession
                  ? t("truthOrLiar.waitingFriendChoice")
                  : t("truthOrLiar.waitingFriendChoice")}
              </span>
            </div>
            <div className="flex justify-end">
              <button className="btn btn-ghost" onClick={handleExitGame}>
                {t("truthOrLiar.exitGame")}
              </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isInSession) {
    return renderSessionView();
  }

  if (!isPlusOrAdmin) {
    return (
      <div className="w-full">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
          <section className="rounded-3xl border border-base-300 bg-base-100/80 p-8 shadow-xl text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Truth or Lie
            </p>
            <h1 className="text-4xl font-bold text-base-content">
              {t("truthOrLiar.comingSoonTitle")}
            </h1>
            <p className="text-base text-base-content/70">
              {t("truthOrLiar.comingSoonSubtitle")}
            </p>
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
                Truth or Lie
              </p>
              <h1 className="text-4xl font-bold text-base-content">{t("truthOrLiar.title")}</h1>
              <p className="text-base text-base-content/70">{t("truthOrLiar.subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge icon={Gamepad2Icon} label={t("truthOrLiar.badgeModes")} />
              <Badge icon={PenLineIcon} label={t("truthOrLiar.badgeCustomDeck")} />
              <Badge icon={ListChecksIcon} label={t("truthOrLiar.badgeLive")} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100/80 p-5 shadow">
            <div className="flex items-center gap-2">
              <BellIcon className="size-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-base-content">
                  {t("truthOrLiar.inviteTitle")}
                </h3>
                <p className="text-sm text-base-content/70">
                  {t("truthOrLiar.inviteDescription")}
                </p>
              </div>
            </div>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text text-sm">{t("truthOrLiar.friendListLabel")}</span>
              </div>
              <select
                className="select select-bordered w-full"
                onChange={handleSelectFriend}
                value={selectedFriend?._id || ""}
                disabled={loadingFriends}
              >
                <option value="">
                  {loadingFriends
                    ? t("truthOrLiar.loadingFriends")
                    : t("truthOrLiar.selectFriendPlaceholder")}
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
                  {t("truthOrLiar.loadingFriends")}
                </span>
              )}
              {!loadingFriends && sortedFriends.length === 0 && (
                <span className="mt-2 text-xs text-base-content/60">
                  {t("truthOrLiar.noFriends")}
                </span>
              )}
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-primary flex-1"
                onClick={handleSendInvite}
                disabled={!selectedFriend || stage === "inviting" || !isPlusOrAdmin}
              >
                <PlayCircleIcon className="size-4" />
                {t("truthOrLiar.sendInvite")}
              </button>
              <button className="btn btn-ghost" onClick={handleCancelInvite}>
                {t("truthOrLiar.cancelInvite")}
              </button>
            </div>

            {stage === "inviting" && (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TimerIcon className="size-4" />
                  <span>
                    {t("truthOrLiar.inviteCountdown", {
                      seconds: inviteRemaining,
                    })}
                  </span>
                </div>
                <p className="text-warning/80">{t("truthOrLiar.waitingResponse")}</p>
              </div>
            )}

            {stage === "accepted" && (
              <div className="flex flex-col gap-2 rounded-2xl border border-success/40 bg-success/10 p-3 text-success">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-5" />
                  <span>
                    {t("truthOrLiar.inviteAccepted", {
                      name: friendLabel,
                    })}
                  </span>
                </div>
                {!isHostSession && (
                  <p className="text-sm text-success/80">{t("truthOrLiar.waitingHost")}</p>
                )}
              </div>
            )}

            {stage === "declined" && (
              <div className="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error">
                {t("truthOrLiar.inviteDeclined", { name: friendLabel })}
              </div>
            )}

            {stage === "expired" && (
              <div className="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/70">
                {t("truthOrLiar.inviteExpired")}
              </div>
            )}
          </section>

          <section className="lg:col-span-2 rounded-3xl border border-base-300 bg-base-100/80 p-6 shadow space-y-4">
            {isHostSession && isPlusOrAdmin ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-primary">
                      {t("truthOrLiar.deckTitle")}
                    </p>
                    <h2 className="text-2xl font-semibold text-base-content">
                      {t("truthOrLiar.deckSubtitle")}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-base-content/60">
                      {t("truthOrLiar.modeLabel")}
                    </span>
                    <div className="join">
                      <button
                        className={`btn join-item ${mode === "short" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setMode("short")}
                      >
                        {t("truthOrLiar.shortMode")}
                      </button>
                      <button
                        className={`btn join-item ${mode === "long" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setMode("long")}
                      >
                        {t("truthOrLiar.longMode")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((question, idx) => (
                    <QuestionEditor
                      key={question.id}
                      question={question}
                      index={idx}
                      onPromptChange={(value) => updateQuestionPrompt(idx, value)}
                      onOptionChange={(optIdx, value) => updateQuestionOption(idx, optIdx, value)}
                      onLieChange={(optIdx) => setLieIndex(idx, optIdx)}
                      t={t}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-base-content/70">
                    {isDeckReady ? (
                      <span className="text-success">{t("truthOrLiar.deckReady")}</span>
                    ) : (
                      <span>{t("truthOrLiar.deckIncomplete")}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleStartGame}
                    disabled={!isDeckReady || stage !== "accepted"}
                  >
                    <PlayCircleIcon className="size-4" />
                    {t("truthOrLiar.startGame")}
                  </button>
                </div>
              </>
            ) : isPlusOrAdmin ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-base-200 bg-base-100/80 p-5 text-sm text-base-content/80">
                <div className="flex items-center gap-2 text-base-content">
                  <SparklesIcon className="size-5 text-primary" />
                  <span className="font-semibold">{t("truthOrLiar.waitingHost")}</span>
                </div>
                <p>{t("truthOrLiar.guestHint")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-base-200 bg-base-100/80 p-5 text-sm text-base-content/80">
                <div className="flex items-center gap-2 text-base-content">
                  <SparklesIcon className="size-5 text-primary" />
                  <span className="font-semibold">{t("truthOrLiar.plusOnly")}</span>
                </div>
                <p>{t("truthOrLiar.comingSoonSubtitle")}</p>
              </div>
            )}
          </section>
        </div>

        {incomingInvites.length > 0 && (
          <section className="rounded-3xl border border-info/40 bg-info/10 p-5 space-y-3">
            <div className="flex items-center gap-2 text-info">
              <BellIcon className="size-5" />
              <span className="text-sm font-semibold">
                {t("truthOrLiar.incomingTitle")}
              </span>
            </div>
            <p className="text-sm text-info/80">{t("truthOrLiar.incomingSubtitle")}</p>
            <div className="grid gap-3 md:grid-cols-2">
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
                          {invite.fromUser?.fullName || t("truthOrLiar.friendFallback")}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {t("truthOrLiar.incomingSubtitle")}
                        </p>
                      </div>
                      <span className="badge badge-outline">{secondsLeft}s</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-success btn-sm flex-1"
                        onClick={() => handleIncomingRespond(invite, true)}
                      >
                        {t("truthOrLiar.acceptInvite")}
                      </button>
                      <button
                        className="btn btn-outline btn-sm flex-1"
                        onClick={() => handleIncomingRespond(invite, false)}
                      >
                        {t("truthOrLiar.declineInvite")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TruthOrLiePage;

