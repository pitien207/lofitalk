import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INVITE_DURATION = 30;
const STORAGE_KEY = "matchmind-game-state";

const QUESTION_BANK = {
  easy: [
    {
      id: "easy-1",
      prompt: "Nếu đi chơi chung, bạn muốn vibe gì?",
      options: ["Vui – năng lượng", "Chill nhẹ", "Im lặng nhưng dễ chịu", "Cà khịa nhau suốt"],
    },
    {
      id: "easy-2",
      prompt: "Hoạt động muốn thử cùng “người kia”?",
      options: ["Đi cafe", "Xem phim", "Đi dạo", "Chụp ảnh chung"],
    },
    {
      id: "easy-3",
      prompt: "Điều bạn để ý nhất khi đi chơi với một người “không phải bạn bè bình thường”?",
      options: ["Cảm giác thoải mái", "Phản ứng và ánh mắt của họ", "Cách họ quan tâm", "Cách họ nói chuyện với mình"],
    },
    {
      id: "easy-4",
      prompt: "Nếu cả hai vô tình chạm tay, bạn sẽ…",
      options: ["Giật mình", "Giả vờ không thấy gì", "Đỏ mặt", "Để yên cho tự nhiên 😌"],
    },
    {
      id: "easy-5",
      prompt: "Một buổi hẹn nhẹ nhàng hoàn hảo là…",
      options: ["Ngồi xem phim", "Nói chuyện cả tối", "Đi ăn vặt", "Đi dạo buổi tối"],
    },
    {
      id: "easy-6",
      prompt: "Kiểu tin nhắn khiến bạn thấy thích thích?",
      options: ["“Về chưa?”", "“Ăn gì chưa?”", "“Tao đang rảnh nè”", "“Hôm nay có gì vui không?”"],
    },
    {
      id: "easy-7",
      prompt: "Nếu hai đứa cùng làm một hoạt động, bạn thích gì nhất?",
      options: ["Nấu ăn", "Decor góc phòng", "Chụp ảnh sống ảo", "Nghe nhạc + chill"],
    },
    {
      id: "easy-8",
      prompt: "Điều làm bạn tò mò nhất về người kia?",
      options: ["Gu tình yêu", "Gu nhạc", "Tính cách thật khi thân rồi", "Ai là “crush” của họ 🤨"],
    },
    {
      id: "easy-9",
      prompt: "Bạn nghĩ hai người hợp nhau khi…",
      options: ["Không sợ im lặng", "Hay nghĩ giống nhau", "Cảm giác thân thuộc lạ", "Cà khịa hợp vibe"],
    },
    {
      id: "easy-10",
      prompt: "Nếu lỡ cả hai đều thích nhau 1 chút, bạn muốn điều gì xảy ra?",
      options: ["Không ai nói nhưng ngầm hiểu", "Một trong hai chủ động", "Cứ để tự nhiên", "Chơi minigame để tỏ tình 😏"],
    },
  ],
  hard: [
    {
      id: "hard-1",
      prompt: "Kiểu hẹn hò bạn thích nhất?",
      options: ["Ở nhà nấu ăn", "Đi chơi xa", "Cafe tâm sự", "Hoạt động đôi (gym/yoga/đạp xe)"],
    },
    {
      id: "hard-2",
      prompt: "Điều khiến bạn cảm thấy an toàn khi ở cạnh ai đó?",
      options: ["Họ lắng nghe", "Họ hành động nhất quán", "Sự nhẹ nhàng", "Sự chủ động"],
    },
    {
      id: "hard-3",
      prompt: "Trong một mối quan hệ, bạn coi trọng nhất điều gì?",
      options: ["Niềm tin", "Quan tâm", "Tôn trọng", "Sự đồng hành"],
    },
    {
      id: "hard-4",
      prompt: "Khi giận, bạn muốn người kia làm gì?",
      options: ["Nói chuyện ngay", "Ôm", "Cho mình thời gian", "Mua đồ ăn xin lỗi 😌"],
    },
    {
      id: "hard-5",
      prompt: "Hoạt động đôi mà bạn muốn thử nhất?",
      options: ["Du lịch chung", "Tập thể dục chung", "Học nấu ăn chung", "Chụp ảnh/ làm kỷ niệm"],
    },
    {
      id: "hard-6",
      prompt: "Kiểu thể hiện tình cảm của bạn là…",
      options: ["Hành động", "Lời nói", "Chạm", "Dành thời gian"],
    },
    {
      id: "hard-7",
      prompt: "Nếu hai đứa bất đồng quan điểm, bạn chọn…",
      options: ["Ngồi xuống nói chuyện", "Mỗi người nghĩ 1 lúc rồi nói", "Nhường", "Đi chơi cho hết căng rồi nói tiếp"],
    },
    {
      id: "hard-8",
      prompt: "Bạn quan tâm điều gì nhất khi yêu?",
      options: ["Tương lai chung", "Cách đối phương đối xử với mình", "Giá trị sống", "Sự phù hợp tính cách"],
    },
    {
      id: "hard-9",
      prompt: "Trong tình yêu, bạn muốn “vai” nào?",
      options: ["Chủ động dẫn dắt", "Nửa chủ động nửa mềm", "Dịu dàng – quan tâm", "Cùng nhau cân bằng"],
    },
    {
      id: "hard-10",
      prompt: "Nếu phải mô tả tình cảm hiện tại dành cho đối phương?",
      options: ["Ngọt", "Ấm", "Tò mò", "Đậm dần"],
    },
  ],
};

const defaultState = {
  stage: "lobby",
  difficulty: "easy",
  selectedFriend: null,
  inviteRemaining: INVITE_DURATION,
  inviteExpiresAt: null,
  inviteId: null,
  sessionId: null,
  roundIndex: 0,
  currentAnswers: { yours: null, friend: null },
  history: [],
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const getInitialState = () => {
  if (typeof window === "undefined") return defaultState;
  const saved = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!saved) return defaultState;

  const now = Date.now();
  const inviteExpiresAt =
    typeof saved.inviteExpiresAt === "number" ? saved.inviteExpiresAt : null;
  const inviteRemaining = inviteExpiresAt
    ? Math.max(0, Math.ceil((inviteExpiresAt - now) / 1000))
    : INVITE_DURATION;
  const stage =
    saved.stage === "inviting" && inviteRemaining <= 0
      ? "expired"
      : saved.stage || defaultState.stage;

  return {
    ...defaultState,
    ...saved,
    stage,
    inviteExpiresAt,
    inviteRemaining,
    history: Array.isArray(saved.history) ? saved.history : defaultState.history,
    currentAnswers: saved.currentAnswers || defaultState.currentAnswers,
  };
};

export const useMatchMindGame = () => {
  const initialState = useRef(getInitialState()).current;
  const [stage, setStage] = useState(initialState.stage); // lobby | inviting | accepted | declined | expired | playing | results
  const [difficulty, setDifficulty] = useState(initialState.difficulty);
  const [selectedFriend, setSelectedFriend] = useState(initialState.selectedFriend);
  const [inviteRemaining, setInviteRemaining] = useState(initialState.inviteRemaining);
  const [inviteExpiresAt, setInviteExpiresAt] = useState(initialState.inviteExpiresAt);
  const [inviteId, setInviteId] = useState(initialState.inviteId);
  const [sessionId, setSessionId] = useState(initialState.sessionId);
  const [roundIndex, setRoundIndex] = useState(initialState.roundIndex);
  const [currentAnswers, setCurrentAnswers] = useState(initialState.currentAnswers);
  const [history, setHistory] = useState(initialState.history);

  const resolvingRef = useRef(false);
  const previousRoundRef = useRef(initialState.roundIndex);

  const questions = useMemo(
    () => QUESTION_BANK[difficulty] || QUESTION_BANK.easy,
    [difficulty]
  );
  const currentQuestion = questions[roundIndex] || null;

  const resetToLobby = useCallback(() => {
    setStage("lobby");
    setDifficulty("easy");
    setInviteRemaining(INVITE_DURATION);
    setInviteExpiresAt(null);
    setInviteId(null);
    setSessionId(null);
    setRoundIndex(0);
    setCurrentAnswers({ yours: null, friend: null });
    setHistory([]);
    previousRoundRef.current = 0;
    resolvingRef.current = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
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

  const startGame = useCallback(
    (mode = "easy") => {
      const nextMode = QUESTION_BANK[mode] ? mode : "easy";
      setDifficulty(nextMode);
      setStage("playing");
      setSessionId((prev) => prev || inviteId || null);
      setRoundIndex(0);
      setCurrentAnswers({ yours: null, friend: null });
      setHistory([]);
      previousRoundRef.current = 0;
      resolvingRef.current = false;
    },
    [inviteId]
  );

  const startGameFromRemote = useCallback(
    (session, mode = "easy") => {
      const nextMode = QUESTION_BANK[mode] ? mode : "easy";
      setDifficulty(nextMode);
      if (session) setSessionId(session);
      setStage("playing");
      setRoundIndex(0);
      setCurrentAnswers({ yours: null, friend: null });
      setHistory([]);
      previousRoundRef.current = 0;
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
    if (typeof window === "undefined") return undefined;
    const payload = {
      stage,
      difficulty,
      selectedFriend,
      inviteRemaining,
      inviteExpiresAt,
      inviteId,
      sessionId,
      roundIndex,
      currentAnswers,
      history,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    stage,
    difficulty,
    selectedFriend,
    inviteRemaining,
    inviteExpiresAt,
    inviteId,
    sessionId,
    roundIndex,
    currentAnswers,
    history,
  ]);

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

    const isNewRound = previousRoundRef.current !== roundIndex;
    if (isNewRound) {
      previousRoundRef.current = roundIndex;
      setCurrentAnswers({ yours: null, friend: null });
      resolvingRef.current = false;
    } else {
      resolvingRef.current = false;
    }
  }, [stage, roundIndex]);

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
    difficulty,
  };
};
