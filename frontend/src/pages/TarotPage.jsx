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
import { useTranslation } from "../languages/useTranslation";

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
  const { t } = useTranslation();

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
  const lastRefillLabel = lastRefill
    ? new Date(lastRefill).toLocaleDateString()
    : t("tarot.energy.pendingDate");
  const energySummary = t("tarot.energy.summary", {
    current: isLoadingEnergy ? "..." : energy,
    max: ENERGY_MAX,
  });
  const regenHint = t("tarot.energy.regenHint", { date: lastRefillLabel });

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
      setErrorMsg(t("tarot.errors.needQuestionsBeforeDraw"));
      return;
    }

    if (isLoadingEnergy) {
      setErrorMsg(t("tarot.errors.loadingEnergy"));
      return;
    }

    if (energy < ENERGY_MAX) {
      setErrorMsg(
        t("tarot.errors.needEnergy", { required: ENERGY_MAX, current: energy })
      );
      return;
    }

    if (!deck.length) {
      setErrorMsg(t("tarot.errors.noDeck"));
      return;
    }

    try {
      await consumeEnergy();
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || t("tarot.errors.consumeFailed")
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
      setErrorMsg(t("tarot.errors.notEnoughCards"));
      return;
    }

    setDrawnCards(picks);
    triggerFlipAnimation();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (questions.some((question) => !question.trim())) {
      setErrorMsg(t("tarot.errors.needQuestions"));
      return;
    }

    if (drawnCards.some((card) => !card)) {
      setErrorMsg(t("tarot.errors.needDrawnCards"));
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
          err?.response?.data?.message || t("tarot.errors.refillFailed")
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
                <h1 className="text-2xl font-bold">{t("tarot.title")}</h1>
                <p className="text-sm opacity-70">
                  {t("tarot.subtitle", { required: ENERGY_MAX })}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">{energySummary}</div>
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
                <p className="text-[11px] opacity-60">{regenHint}</p>
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
                    {t("tarot.buttons.consuming")}
                  </>
                ) : (
                  <>
                    <ShuffleIcon className="size-4 mr-2" /> {t("tarot.buttons.draw")}
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
                    <LoaderIcon className="size-4 mr-2 animate-spin" />
                    {t("tarot.buttons.clearing")}
                  </>
                ) : (
                  <>
                    <RotateCcwIcon className="size-4 mr-2" /> {t("tarot.buttons.clear")}
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
                    {t("tarot.buttons.refilling")}
                  </>
                ) : (
                  t("tarot.buttons.refill")
                )}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">{t("tarot.cards.title")}</h2>
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
                        alt={card ? card.name : t("tarot.cards.backAlt")}
                        className={`tarot-card__image ${
                          card?.reversed ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <div className="mt-2 min-h-6 text-center text-sm font-medium">
                      {card ? (
                        <>
                          {card.name}
                          {card.reversed ? t("tarot.cards.reversed") : ""}
                        </>
                      ) : (
                        <span className="opacity-0">
                          {t("tarot.cards.placeholder")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {t("tarot.questions.title")}
                </h2>
                <p className="text-xs opacity-70 mb-3">
                  {t("tarot.questions.instructions")}
                </p>
                <div className="space-y-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="form-control">
                      <label className="label">
                        <span className="label-text">
                          {t("tarot.questions.label", { number: index + 1 })}
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder={t("tarot.questions.placeholder", {
                          number: index + 1,
                        })}
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
                    <LoaderIcon className="size-4 mr-2 animate-spin" />{" "}
                    {t("tarot.questions.submitting")}
                  </>
                ) : (
                  t("tarot.questions.submit")
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
                      t("tarot.errors.readingFailed")}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>

        {readingResult && (
          <div className="card bg-base-200 shadow">
            <div className="card-body space-y-4">
              <h2 className="text-xl font-semibold">{t("tarot.results.title")}</h2>
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
                                {t("tarot.results.questionPrefix", {
                                  index: index + 1,
                                })}{" "}
                                {item.question}
                              </p>
                              <p className="font-semibold mt-1">
                                {t("tarot.results.cardLabel")}: {item.card}
                              </p>
                              <p className="mt-1">{item.message}</p>
                              <p className="mt-1 text-primary">
                                {t("tarot.results.adviceLabel")}: {item.advice}
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
                      <p className="font-semibold">{t("tarot.results.aiTitle")}</p>
                      <p className="text-sm whitespace-pre-line">{fallbackText}</p>
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
