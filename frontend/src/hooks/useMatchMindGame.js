import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INVITE_DURATION = 30;
const QUESTION_DURATION = 10;

const QUESTION_BANK = [
  {
    id: "q1",
    prompt: "Pick the ideal Friday night with your friend",
    options: ["Street food & strolling", "Board games at home", "Live music night", "Long drive with playlists"],
  },
  {
    id: "q2",
    prompt: "Your focus drink when you need to get things done",
    options: ["Black coffee", "Milk tea", "Matcha latte", "Fruit smoothie"],
  },
  {
    id: "q3",
    prompt: "Preferred way to recharge after a busy week",
    options: ["Solo reading", "Gym session", "Cooking something new", "Power nap"],
  },
  {
    id: "q4",
    prompt: "Dream mini trip for the two of you",
    options: ["Beach sunrise", "Mountain cabin", "City museum crawl", "Theme park rides"],
  },
  {
    id: "q5",
    prompt: "Your default chat reaction style",
    options: ["Memes & gifs", "Voice notes", "Long texts", "Short replies & emojis"],
  },
  {
    id: "q6",
    prompt: "Song to start a shared playlist",
    options: ["Lo-fi beats", "Indie folk", "Pop banger", "Old-school R&B"],
  },
  {
    id: "q7",
    prompt: "Comfort food when you're rushing",
    options: ["Instant noodles", "Banh mi / sandwich", "Sushi rolls", "Pizza slice"],
  },
  {
    id: "q8",
    prompt: "Best time for deep talks",
    options: ["Late at night", "Early morning", "Lunch break", "Random commute"],
  },
  {
    id: "q9",
    prompt: "Pick a challenge to try together",
    options: ["Learn a dance", "Cook a new cuisine", "Language flashcards", "Daily journaling"],
  },
  {
    id: "q10",
    prompt: "Rainy day plan",
    options: ["Movie marathon", "Coffee shop writing", "Declutter the room", "Call a friend and chat"],
  },
];

export const useMatchMindGame = () => {
  const [stage, setStage] = useState("lobby"); // lobby | inviting | accepted | declined | expired | playing | results
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [inviteRemaining, setInviteRemaining] = useState(INVITE_DURATION);
  const [inviteExpiresAt, setInviteExpiresAt] = useState(null);
  const [inviteId, setInviteId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(QUESTION_DURATION);
  const [currentAnswers, setCurrentAnswers] = useState({ yours: null, friend: null });
  const [history, setHistory] = useState([]);

  const resolvingRef = useRef(false);

  const questions = useMemo(() => QUESTION_BANK.slice(0, 10), []);
  const currentQuestion = questions[roundIndex] || null;

  const resetToLobby = useCallback(() => {
    setStage("lobby");
    setInviteRemaining(INVITE_DURATION);
    setInviteExpiresAt(null);
    setInviteId(null);
    setSessionId(null);
    setRoundIndex(0);
    setQuestionTimer(QUESTION_DURATION);
    setCurrentAnswers({ yours: null, friend: null });
    setHistory([]);
    resolvingRef.current = false;
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
      setHistory([]);
      resolvingRef.current = false;
      return true;
    },
    [selectedFriend]
  );

  const acceptInvite = useCallback(() => {
    if (stage !== "inviting") return;
    setStage("accepted");
  }, [stage]);

  const declineInvite = useCallback(() => {
    if (stage !== "inviting") return;
    setStage("declined");
  }, [stage]);

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

  const startGame = useCallback(() => {
    setStage("playing");
    setSessionId((prev) => prev || inviteId || null);
    setRoundIndex(0);
    setQuestionTimer(QUESTION_DURATION);
    setCurrentAnswers({ yours: null, friend: null });
    setHistory([]);
    resolvingRef.current = false;
  }, [inviteId]);

  const startGameFromRemote = useCallback(
    (session) => {
      if (session) setSessionId(session);
      setStage("playing");
      setRoundIndex(0);
      setQuestionTimer(QUESTION_DURATION);
      setCurrentAnswers({ yours: null, friend: null });
      setHistory([]);
      resolvingRef.current = false;
    },
    []
  );

  const exitGame = useCallback(() => {
    resetToLobby();
  }, [resetToLobby]);

  const chooseAnswer = useCallback(
    (option) => {
      if (stage !== "playing") return;
      setCurrentAnswers((prev) => (prev.yours ? prev : { ...prev, yours: option }));
    },
    [stage]
  );

  const setFriendAnswer = useCallback(
    (option) => {
      if (stage !== "playing") return;
      setCurrentAnswers((prev) => (prev.friend ? prev : { ...prev, friend: option }));
    },
    [stage]
  );

  const resolveRound = useCallback(
    (reason = "timeout") => {
      if (resolvingRef.current || stage !== "playing") return;
      const question = questions[roundIndex];
      if (!question) return;

      resolvingRef.current = true;

      const yourAnswer = currentAnswers.yours;
      const friendAnswer = currentAnswers.friend;

      setHistory((prev) => [
        ...prev,
        {
          id: question.id,
          question: question.prompt,
          yourAnswer,
          friendAnswer,
          matched: Boolean(yourAnswer && friendAnswer && yourAnswer === friendAnswer),
          reason,
        },
      ]);

      if (roundIndex + 1 >= questions.length) {
        setStage("results");
        return;
      }

      setRoundIndex((prev) => prev + 1);
    },
    [questions, roundIndex, currentAnswers, stage]
  );

  useEffect(() => {
    if (stage !== "inviting" || !inviteExpiresAt) return;

    const intervalId = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((inviteExpiresAt - Date.now()) / 1000));
      setInviteRemaining(remaining);

      if (remaining <= 0) {
        setStage("expired");
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [stage, inviteExpiresAt]);

  useEffect(() => {
    if (stage !== "playing") return;

    resolvingRef.current = false;
    setCurrentAnswers({ yours: null, friend: null });
    setQuestionTimer(QUESTION_DURATION);

    const countdownId = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdownId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownId);
  }, [stage, roundIndex]);

  useEffect(() => {
    if (stage !== "playing") return;
    if (questionTimer === 0) {
      resolveRound("timeout");
    }
  }, [questionTimer, stage, resolveRound]);

  useEffect(() => {
    if (stage !== "playing") return;
    if (currentAnswers.yours && currentAnswers.friend) {
      const advanceId = setTimeout(() => resolveRound("both-answered"), 600);
      return () => clearTimeout(advanceId);
    }
  }, [stage, currentAnswers.yours, currentAnswers.friend, resolveRound]);

  useEffect(() => {
    if (stage === "results" || stage === "lobby") {
      resolvingRef.current = false;
    }
  }, [stage]);

  const matches = history.filter((item) => item.matched).length;
  const liveScore =
    matches +
    (stage === "playing" &&
    currentAnswers.yours &&
    currentAnswers.friend &&
    currentAnswers.yours === currentAnswers.friend
      ? 1
      : 0);

  return {
    stage,
    selectedFriend,
    setSelectedFriend,
    inviteRemaining,
    sendInvite,
    inviteId,
    setInviteId,
    acceptInvite,
    declineInvite,
    startGame,
    startGameFromRemote,
    exitGame,
    cancelInvite: resetToLobby,
    questionTimer,
    currentQuestion,
    roundIndex,
    questions,
    currentAnswers,
    chooseAnswer,
    setFriendAnswer,
    history,
    matches,
    liveScore,
    sessionId,
    markAcceptedByFriend,
    markDeclinedByFriend,
    markInviteExpired,
  };
};
