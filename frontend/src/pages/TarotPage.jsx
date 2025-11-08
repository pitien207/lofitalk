import { useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { LoaderIcon, RotateCcwIcon, ShuffleIcon } from "lucide-react";

import {
  consumeTarotEnergy,
  getTarotEnergy,
  refillTarotEnergy,
  getTarotLatest,
  clearTarotLatest,
  getTarotReading,
} from "../lib/api";
import cardBackImg from "../pictures/cards/CardBacks.png";
import "../tarot.css";

const cardModules = import.meta.glob("../pictures/cards/*.png", { eager: true });
const ENERGY_MAX = 7;

const TarotPage = () => {
  const deck = useMemo(() => {
    return Object.entries(cardModules)
      .filter(([path]) => !path.endsWith("CardBacks.png"))
      .map(([path, mod]) => {
        const filename = path.split("/").pop() || "";
        const name = filename.replace(/\.png$/i, "");
        return { name, src: mod.default };
      });
  }, []);

  const [questions, setQuestions] = useState(["", "", ""]);
  const [drawnCards, setDrawnCards] = useState([null, null, null]);
  const [readingResult, setReadingResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const animationTimeoutRef = useRef(null);
  const hasHydratedFromServer = useRef(false);
  const queryClient = useQueryClient();

  const {
    data: energyData,
    isLoading: isLoadingEnergy,
  } = useQuery({
    queryKey: ["tarotEnergy"],
    queryFn: getTarotEnergy,
  });

  const { data: latestData } = useQuery({
    queryKey: ["tarotLatest"],
    queryFn: getTarotLatest,
  });

  const energy = energyData?.energy ?? 0;
  const normalizedEnergy = Math.max(0, Math.min(energy, ENERGY_MAX));
  const lastRefill = energyData?.lastRefill;

  const { mutateAsync: consumeEnergy, isPending: isConsuming } = useMutation({
    mutationFn: consumeTarotEnergy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarotEnergy"] });
    },
  });

  const { mutate: refillEnergyMutation, isPending: isRefilling } = useMutation({
    mutationFn: refillTarotEnergy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarotEnergy"] });
    },
  });

  const { mutate: requestReading, isPending: isReadingPending, error } =
    useMutation({
      mutationFn: getTarotReading,
      onSuccess: (response) => {
        const result = response?.result || response?.data?.result || response;
        setReadingResult(result);
        queryClient.invalidateQueries({ queryKey: ["tarotLatest"] });
      },
    });

  const { mutate: clearLatestMutation, isPending: isClearing } = useMutation({
    mutationFn: clearTarotLatest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarotLatest"] });
    },
  });

  useEffect(() => {
    if (hasHydratedFromServer.current) return;
    if (!latestData?.reading) return;

    const { questions: storedQuestions, cards: storedCards, result } =
      latestData.reading;

    if (result) {
      setReadingResult(result);
    }

    if (Array.isArray(storedQuestions) && storedQuestions.length === 3) {
      setQuestions(storedQuestions);
    }

    if (Array.isArray(storedCards) && storedCards.length === 3) {
      const mapped = storedCards.map((card) => {
        const match = deck.find((c) => c.name === card.name);
        return {
          ...card,
          src: match?.src || cardBackImg,
        };
      });
      setDrawnCards(mapped);
    }

    hasHydratedFromServer.current = true;
  }, [latestData, deck]);

  const triggerFlipAnimation = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setIsRevealing(true);
    animationTimeoutRef.current = setTimeout(() => setIsRevealing(false), 800);
  };

  const handleDrawCards = async () => {
    setErrorMsg("");

    if (questions.some((question) => !question.trim())) {
      setErrorMsg("Hãy nhập đủ 3 câu hỏi trước khi bốc bài.");
      return;
    }

    if (isLoadingEnergy) {
      setErrorMsg("Đang tải trạng thái năng lượng...");
      return;
    }

    if (energy < ENERGY_MAX) {
      setErrorMsg(
        `Bạn cần ${ENERGY_MAX} năng lượng để bốc bài (hiện có ${energy}/${ENERGY_MAX}).`
      );
      return;
    }

    if (!deck.length) {
      setErrorMsg("Không tìm thấy bộ bài.");
      return;
    }

    try {
      await consumeEnergy();
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || "Không thể tiêu hao năng lượng."
      );
      return;
    }

    const pool = [...deck];
    const picks = [];

    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const reversed = Math.random() < 0.5;
      picks.push({ ...pool[idx], reversed });
      pool.splice(idx, 1);
    }

    if (picks.length !== 3) {
      setErrorMsg("Không đủ lá bài để bốc.");
      return;
    }

    setDrawnCards(picks);
    triggerFlipAnimation();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (questions.some((question) => !question.trim())) {
      setErrorMsg("Hãy nhập đủ 3 câu hỏi.");
      return;
    }

    if (drawnCards.some((card) => !card)) {
      setErrorMsg("Hãy bốc đủ 3 lá bài trước.");
      return;
    }

    const cards = drawnCards.map((card) => ({
      name: card?.name,
      reversed: Boolean(card?.reversed),
    }));

    requestReading({ questions, cards });
  };

  const handleClearTable = () => {
    setDrawnCards([null, null, null]);
    setQuestions(["", "", ""]);
    setReadingResult(null);
    setErrorMsg("");
    clearLatestMutation();
  };

  const handleRefillEnergy = () => {
    setErrorMsg("");
    refillEnergyMutation(undefined, {
      onError: (err) =>
        setErrorMsg(
          err?.response?.data?.message || "Không thể refill năng lượng."
        ),
    });
  };

  const cleanedRawText = useMemo(() => {
    if (!readingResult?.raw) return "";
    return readingResult.raw.replace(/```json|```/gi, "").trim();
  }, [readingResult]);

  const parsedFromRaw = useMemo(() => {
    if (!cleanedRawText) return null;
    try {
      return JSON.parse(cleanedRawText);
    } catch (err) {
      return null;
    }
  }, [cleanedRawText]);

  const displayedReadings = readingResult?.readings?.length
    ? readingResult.readings
    : parsedFromRaw?.readings;

  const overallMessage =
    readingResult?.overall_message ??
    parsedFromRaw?.overall_message ??
    parsedFromRaw?.message ??
    parsedFromRaw?.summary;

  const fallbackText = useMemo(() => {
    if (!cleanedRawText || parsedFromRaw || displayedReadings?.length) return "";
    return cleanedRawText
      .replace(/{|}|\[|\]|"/g, "")
      .replace(/,/g, "\n")
      .replace(/\\n/g, "\n")
      .trim();
  }, [cleanedRawText, parsedFromRaw, displayedReadings]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="card bg-base-200 shadow">
          <div className="card-body space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Tarot Reading</h1>
                <p className="text-sm opacity-70">
                  Cần tích lũy đủ {ENERGY_MAX} năng lượng (mỗi ngày +1) để bốc bài.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">
                  Năng lượng:{" "}
                  {isLoadingEnergy ? "..." : `${energy}/${ENERGY_MAX}`}
                </div>
                <div className="energy-bar">
                  <div
                    className="energy-bar__fill"
                    style={{
                      width: `${(normalizedEnergy / ENERGY_MAX) * 100}%`,
                    }}
                  />
                  <div className="energy-bar__icons">
                    {Array.from({ length: ENERGY_MAX }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`energy-orb ${
                          idx < normalizedEnergy ? "energy-orb--active" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] opacity-60">
                  +1 năng lượng mỗi ngày. Lần hồi gần nhất:{" "}
                  {lastRefill
                    ? new Date(lastRefill).toLocaleDateString()
                    : "..."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleDrawCards}
                disabled={isConsuming || isLoadingEnergy}
              >
                {isConsuming ? (
                  <>
                    <LoaderIcon className="size-4 mr-2 animate-spin" />
                    Đang tiêu hao...
                  </>
                ) : (
                  <>
                    <ShuffleIcon className="size-4 mr-2" /> Draw Cards
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClearTable}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <LoaderIcon className="size-4 mr-2 animate-spin" /> Clearing...
                  </>
                ) : (
                  <>
                    <RotateCcwIcon className="size-4 mr-2" /> Clear Table
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefillEnergy}
                disabled={isRefilling}
              >
                {isRefilling ? (
                  <>
                    <LoaderIcon className="size-4 mr-2 animate-spin" />
                    Refilling...
                  </>
                ) : (
                  "Refill Energy"
                )}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Lá bài đã bốc</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {drawnCards.map((card, index) => (
                  <div key={index} className="tarot-card-slot">
                    <div
                      className={`tarot-card ${
                        isRevealing ? "tarot-card--flip" : ""
                      }`}
                    >
                      <img
                        src={card ? card.src : cardBackImg}
                        alt={card ? card.name : "Card back"}
                        className={`tarot-card__image ${
                          card?.reversed ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <div className="mt-2 min-h-6 text-center text-sm font-medium">
                      {card ? (
                        <>
                          {card.name}
                          {card.reversed ? " (reversed)" : ""}
                        </>
                      ) : (
                        <span className="opacity-0">placeholder</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  Câu hỏi của bạn
                </h2>
                <p className="text-xs opacity-70 mb-3">
                  Thứ tự câu hỏi tương ứng với thứ tự lá bài (trái sang phải).
                </p>
                <div className="space-y-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="form-control">
                      <label className="label">
                        <span className="label-text">Question {index + 1}</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder={`Nhập câu hỏi ${index + 1}`}
                        value={questions[index]}
                        onChange={(event) => {
                          const next = [...questions];
                          next[index] = event.target.value;
                          setQuestions(next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isReadingPending}
              >
                {isReadingPending ? (
                  <>
                    <LoaderIcon className="size-4 mr-2 animate-spin" /> Reading...
                  </>
                ) : (
                  "Get Reading"
                )}
              </button>

              {errorMsg && (
                <div className="alert alert-warning">
                  <span>{errorMsg}</span>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  <span>
                    {error?.response?.data?.message ||
                      "Không thể lấy kết quả, thử lại."}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>

        {readingResult && (
          <div className="card bg-base-200 shadow">
            <div className="card-body space-y-4">
              <h2 className="text-xl font-semibold">Thông điệp dành cho bạn</h2>
              {displayedReadings?.length ? (
                <>
                  <div className="space-y-3">
                    {displayedReadings.map((item, index) => {
                      const baseName = String(item.card || "").replace(
                        /\s*\(reversed\)\s*$/i,
                        ""
                      );
                      const matched = deck.find(
                        (card) => card.name === baseName
                      );
                      const reversed = /\(reversed\)/i.test(
                        String(item.card || "")
                      );

                      return (
                        <div
                          key={index}
                          className="p-4 border border-base-300 rounded bg-base-100"
                        >
                          <div className="flex items-start gap-3">
                            {matched && (
                              <img
                                src={matched.src}
                                alt={item.card}
                                className={`w-16 h-24 object-cover rounded ${
                                  reversed ? "rotate-180" : ""
                                }`}
                              />
                            )}
                            <div>
                              <p className="text-sm opacity-70">
                                Q{index + 1}: {item.question}
                              </p>
                              <p className="font-semibold mt-1">
                                Card: {item.card}
                              </p>
                              <p className="mt-1">{item.message}</p>
                              <p className="mt-1 text-primary">
                                Advice: {item.advice}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {overallMessage && (
                    <div className="alert">
                      <span>{overallMessage}</span>
                    </div>
                  )}
                </>
              ) : (
                fallbackText && (
                  <div className="alert alert-info">
                    <div>
                      <p className="font-semibold">Thông điệp từ AI</p>
                      <p className="text-sm whitespace-pre-line">
                        {fallbackText}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TarotPage;
