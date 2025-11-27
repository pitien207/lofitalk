import { useCallback, useEffect, useMemo, useState } from "react";

const INVITE_DURATION = 30;
const QUESTION_COUNTS = {
  short: 3,
  long: 5,
};

const makeQuestion = (index, base = {}) => {
  const options = Array.isArray(base.options) ? base.options : [];

  return {
    id: base.id || `truth-${Date.now()}-${index}`,
    prompt: (base.prompt || "").trim(),
    options: [
      (options[0] || "").trim(),
      (options[1] || "").trim(),
      (options[2] || "").trim(),
    ],
    lieIndex:
      typeof base.lieIndex === "number" && base.lieIndex >= 0 && base.lieIndex <= 2
        ? base.lieIndex
        : 0,
  };
};

const sanitizeQuestions = (list = [], targetCount) => {
  const sanitized = [];
  for (let i = 0; i < targetCount; i += 1) {
    sanitized.push(makeQuestion(i, list[i]));
  }
  return sanitized;
};

const isQuestionComplete = (question) =>
  Boolean(question?.prompt?.trim()) &&
  Array.isArray(question?.options) &&
  question.options.length === 3 &&
  question.options.every((option) => Boolean(option?.trim()));

export const useTruthOrLieGame = () => {
  const [stage, setStage] = useState("lobby"); // lobby | inviting | accepted | declined | expired | playing | review
  const [mode, setModeState] = useState("short"); // short | long
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [inviteRemaining, setInviteRemaining] = useState(INVITE_DURATION);
  const [inviteExpiresAt, setInviteExpiresAt] = useState(null);
  const [inviteId, setInviteId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [questions, setQuestions] = useState(() =>
    sanitizeQuestions([], QUESTION_COUNTS.short)
  );
  const [answers, setAnswers] = useState({ yours: {}, friend: {} });

  const questionCount = useMemo(
    () => QUESTION_COUNTS[mode] || QUESTION_COUNTS.short,
    [mode]
  );
  const currentQuestion =
    questions[Math.min(roundIndex, Math.max(questions.length - 1, 0))] || null;
  const isDeckReady = useMemo(
    () => questions.length === questionCount && questions.every(isQuestionComplete),
    [questionCount, questions]
  );

  const resetToLobby = useCallback(() => {
    setStage("lobby");
    setModeState("short");
    setSelectedFriend(null);
    setInviteRemaining(INVITE_DURATION);
    setInviteExpiresAt(null);
    setInviteId(null);
    setSessionId(null);
    setRoundIndex(0);
    setQuestions(sanitizeQuestions([], QUESTION_COUNTS.short));
    setAnswers({ yours: {}, friend: {} });
  }, []);

  const setMode = useCallback((nextMode = "short") => {
    const safeMode = nextMode === "long" ? "long" : "short";
    const targetCount = QUESTION_COUNTS[safeMode];
    setModeState(safeMode);
    setQuestions((prev) => sanitizeQuestions(prev, targetCount));
  }, []);

  const updateQuestionPrompt = useCallback((index, prompt) => {
    setQuestions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, prompt } : item))
    );
  }, []);

  const updateQuestionOption = useCallback((questionIndex, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((item, idx) => {
        if (idx !== questionIndex) return item;
        const options = Array.isArray(item.options) ? [...item.options] : ["", "", ""];
        options[optionIndex] = value;
        return { ...item, options };
      })
    );
  }, []);

  const setLieIndex = useCallback((questionIndex, lieIndex) => {
    setQuestions((prev) =>
      prev.map((item, idx) =>
        idx === questionIndex ? { ...item, lieIndex: Math.max(0, Math.min(2, lieIndex)) } : item
      )
    );
  }, []);

  const sendInvite = useCallback(
    ({ inviteId: providedInviteId, expiresAt } = {}) => {
      if (!selectedFriend) return false;
      setStage("inviting");
      const expiresMs =
        typeof expiresAt === "number"
          ? expiresAt
          : expiresAt instanceof Date
            ? expiresAt.getTime()
            : Date.now() + INVITE_DURATION * 1000;
      setInviteExpiresAt(expiresMs);
      const secondsLeft = Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000));
      setInviteRemaining(secondsLeft || INVITE_DURATION);
      setInviteId(providedInviteId || null);
      setAnswers({ yours: {}, friend: {} });
      return true;
    },
    [selectedFriend]
  );

  const markAcceptedByFriend = useCallback(() => {
    if (stage === "inviting" || stage === "lobby") {
      setStage("accepted");
    }
  }, [stage]);

  const markDeclinedByFriend = useCallback(() => {
    if (stage === "inviting" || stage === "accepted" || stage === "lobby") {
      setStage("declined");
    }
  }, [stage]);

  const markInviteExpired = useCallback(() => {
    if (stage === "inviting") {
      setStage("expired");
    }
  }, [stage]);

  const startGame = useCallback(
    (nextMode = mode, deck = questions) => {
      const safeMode = nextMode === "long" ? "long" : "short";
      const targetCount = QUESTION_COUNTS[safeMode];
      const sanitizedDeck = sanitizeQuestions(deck, targetCount);
      setModeState(safeMode);
      setQuestions(sanitizedDeck);
      setStage("playing");
      setSessionId((prev) => prev || inviteId || null);
      setRoundIndex(0);
      setAnswers({ yours: {}, friend: {} });
    },
    [inviteId, mode, questions]
  );

  const startGameFromRemote = useCallback((session, nextMode = "short", deck = []) => {
    const safeMode = nextMode === "long" ? "long" : "short";
    const targetCount = QUESTION_COUNTS[safeMode];
    const sanitizedDeck = sanitizeQuestions(deck, targetCount);
    setModeState(safeMode);
    if (session) setSessionId(session);
    setQuestions(sanitizedDeck);
    setStage("playing");
    setRoundIndex(0);
    setAnswers({ yours: {}, friend: {} });
  }, []);

  const exitGame = useCallback(() => {
    resetToLobby();
  }, [resetToLobby]);

  const chooseAnswer = useCallback(
    (optionIndex) => {
      if (stage !== "playing") return;
      const question = questions.find((q) => answers.yours[q.id] === undefined);
      if (!question) return;
      setAnswers((prev) => {
        if (prev.yours[question.id] !== undefined) return prev;
        const yours = { ...prev.yours, [question.id]: optionIndex };
        const friend = prev.friend || {};
        const nextIndex = questions.findIndex((q) => yours[q.id] === undefined);
        if (Object.keys(yours).length >= questions.length) {
          setStage("review");
        } else if (nextIndex >= 0) {
          setRoundIndex(nextIndex);
        }
        return { ...prev, yours, friend };
      });
    },
    [questions, answers.yours, stage]
  );

  const setFriendAnswer = useCallback(
    (questionId, optionIndex) => {
      if (stage !== "playing") return;
      setAnswers((prev) => {
        if (prev.friend[questionId] !== undefined) return prev;
        const friend = { ...prev.friend, [questionId]: optionIndex };
        const yours = prev.yours || {};
        const answeredCount = Object.keys(friend).length;
        if (answeredCount >= questions.length && Object.keys(yours).length >= questions.length) {
          setStage("review");
        }
        return { ...prev, yours, friend };
      });
    },
    [questions.length, stage]
  );

  useEffect(() => {
    if (stage !== "inviting" || !inviteExpiresAt) return undefined;

    const intervalId = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((inviteExpiresAt - Date.now()) / 1000));
      setInviteRemaining(remaining);

      if (remaining <= 0) {
        setStage("expired");
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [stage, inviteExpiresAt]);

  return {
    stage,
    mode,
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
    cancelInvite: resetToLobby,
    setFriendAnswer,
    chooseAnswer,
    currentQuestion,
    roundIndex,
    questions,
    setMode,
    updateQuestionPrompt,
    updateQuestionOption,
    setLieIndex,
    answers,
    isDeckReady,
    sessionId,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
  };
};
