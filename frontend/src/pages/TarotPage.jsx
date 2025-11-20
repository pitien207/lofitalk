import { useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { LoaderIcon, RotateCcwIcon } from "lucide-react";
import toast from "react-hot-toast";

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
import useAuthUser from "../hooks/useAuthUser";

const cardModules = import.meta.glob("../pictures/cards/*.png", { eager: true });
const ENERGY_MAX = 7;
const QUESTIONS_FORM_ID = "tarot-questions-form";

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

  const [currentSituation, setCurrentSituation] = useState("");
  const [questions, setQuestions] = useState(["", "", ""]);
  const [drawnCards, setDrawnCards] = useState([null, null, null]);
  const [readingResult, setReadingResult] = useState(null);
  const [flippingIndex, setFlippingIndex] = useState(null);
  const [hasConsumedEnergyThisRound, setHasConsumedEnergyThisRound] =
    useState(false);
  const animationTimeoutRef = useRef(null);
  const hasHydratedFromServer = useRef(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const canRefillEnergy = ["plus", "admin"].includes(authUser?.accountType);

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

  const { mutate: requestReading, isPending: isReadingPending } = useMutation({
    mutationFn: getTarotReading,
    onSuccess: (response) => {
      const result = response?.result || response?.data?.result || response;
      setReadingResult(result);
      queryClient.invalidateQueries({ queryKey: ["tarotLatest"] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || t("tarot.errors.readingFailed")
      );
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

    const {
      currentSituation: storedSituation,
      questions: storedQuestions,
      cards: storedCards,
      result,
    } = latestData.reading;

    if (result) {
      setReadingResult(result);
    }

    if (typeof storedSituation === "string") {
      setCurrentSituation(storedSituation);
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

  const triggerFlipAnimation = (index) => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setFlippingIndex(index);
    animationTimeoutRef.current = setTimeout(() => setFlippingIndex(null), 800);
  };

  const handleCardClick = async (index) => {
    if (drawnCards[index] || isConsuming) return;

    if (!currentSituation.trim()) {
      toast.error(t("tarot.errors.needSituationBeforeDraw"));
      return;
    }

    if (questions.some((question) => !question.trim())) {
      toast.error(t("tarot.errors.needQuestionsBeforeDraw"));
      return;
    }

    if (!hasConsumedEnergyThisRound && isLoadingEnergy) {
      toast.error(t("tarot.errors.loadingEnergy"));
      return;
    }

    if (!hasConsumedEnergyThisRound && energy < ENERGY_MAX) {
      toast.error(
        t("tarot.errors.needEnergy", { required: ENERGY_MAX, current: energy })
      );
      return;
    }

    if (!deck.length) {
      toast.error(t("tarot.errors.noDeck"));
      return;
    }

    try {
      if (!hasConsumedEnergyThisRound) {
        await consumeEnergy();
        setHasConsumedEnergyThisRound(true);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || t("tarot.errors.consumeFailed")
      );
      return;
    }

    const usedNames = drawnCards
      .filter((card) => Boolean(card?.name))
      .map((card) => card?.name);
    const pool = deck.filter((card) => !usedNames.includes(card.name));

    if (!pool.length) {
      toast.error(t("tarot.errors.notEnoughCards"));
      return;
    }

    const idx = Math.floor(Math.random() * pool.length);
    const reversed = Math.random() < 0.5;
    const selectedCard = { ...pool[idx], reversed };

    setDrawnCards((prev) => {
      const next = [...prev];
      next[index] = selectedCard;
      return next;
    });
    triggerFlipAnimation(index);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!currentSituation.trim()) {
      toast.error(t("tarot.errors.needSituation"));
      return;
    }

    if (questions.some((question) => !question.trim())) {
      toast.error(t("tarot.errors.needQuestions"));
      return;
    }

    if (drawnCards.some((card) => !card)) {
      toast.error(t("tarot.errors.needDrawnCards"));
      return;
    }

    const cards = drawnCards.map((card) => ({
      name: card?.name,
      reversed: Boolean(card?.reversed),
    }));

    requestReading({ currentSituation: currentSituation.trim(), questions, cards });
  };

  const handleClearTable = () => {
    setDrawnCards([null, null, null]);
    setQuestions(["", "", ""]);
    setCurrentSituation("");
    setReadingResult(null);
    setHasConsumedEnergyThisRound(false);
    clearLatestMutation();
  };

  const handleRefillEnergy = () => {
    refillEnergyMutation(undefined, {
      onError: (err) =>
        toast.error(
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
    } catch {
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

  const hasThreeCards = drawnCards.every((card) => Boolean(card));
  const canShowResults = Boolean(readingResult) && hasThreeCards;

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
              {canRefillEnergy && (
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
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">{t("tarot.cards.title")}</h2>
              <p className="text-xs opacity-70 mb-4">
                {isConsuming
                  ? t("tarot.buttons.consuming")
                  : t("tarot.cards.tapHint")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {drawnCards.map((card, index) => (
                  <div
                    key={index}
                    className={`tarot-card-slot ${!card ? "tarot-card-slot--clickable" : ""}`}
                  >
                    <div
                      role="button"
                      tabIndex={card ? -1 : 0}
                      aria-disabled={Boolean(card)}
                      className={`tarot-card ${
                        flippingIndex === index ? "tarot-card--flip" : ""
                      } ${!card ? "tarot-card--interactive" : ""}`}
                      onClick={() => handleCardClick(index)}
                      onKeyDown={(event) => {
                        if (
                          !card &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          handleCardClick(index);
                        }
                      }}
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

            <div className="flex justify-center">
              <button
                type="submit"
                form={QUESTIONS_FORM_ID}
                className="btn btn-primary"
                disabled={isReadingPending || !hasThreeCards}
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
            </div>

            {canShowResults && (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-4">
                <h2 className="text-lg font-semibold">{t("tarot.results.title")}</h2>
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
            )}

            <form
              id={QUESTIONS_FORM_ID}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {t("tarot.questions.title")}
                </h2>
                <p className="text-xs opacity-70 mb-3">
                  {t("tarot.questions.instructions")}
                </p>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Hoàn cảnh hiện tại (Current Situation)
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    rows={3}
                    placeholder="Mô tả cảm xúc, vấn đề hoặc bối cảnh bạn đang trải qua..."
                    value={currentSituation}
                    onChange={(event) => setCurrentSituation(event.target.value)}
                  />
                </div>

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

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotPage;
