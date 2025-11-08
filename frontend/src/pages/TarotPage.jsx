import { useMemo, useRef, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { getTarotReading } from "../lib/api";
import { LoaderIcon, ShuffleIcon } from "lucide-react";
import cardBackImg from "../pictures/cards/CardBacks.png";

const cardModules = import.meta.glob("../pictures/cards/*.png", { eager: true });

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
  const [errorMsg, setErrorMsg] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const animationTimeoutRef = useRef(null);

  const { mutate: getReading, data, isPending, error } = useMutation({
    mutationFn: getTarotReading,
  });

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const triggerFlipAnimation = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setIsRevealing(true);
    animationTimeoutRef.current = setTimeout(() => setIsRevealing(false), 800);
  };

  const handleDrawCards = () => {
    setErrorMsg("");
    if (questions.some((question) => !question.trim())) {
      setErrorMsg("Hãy nhập đủ 3 câu hỏi trước khi bốc bài.");
      return;
    }

    if (!deck.length) {
      setErrorMsg("Không tìm thấy ảnh lá bài.");
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

    getReading({ questions, cards });
  };

  const reading = data?.result || data?.data?.result;
  const structuredReadings = reading?.readings;
  const rawReading = reading?.raw;

  const cleanedRawText = useMemo(() => {
    if (!rawReading) return "";
    return rawReading.replace(/```json|```/gi, "").trim();
  }, [rawReading]);

  const parsedFromRaw = useMemo(() => {
    if (!cleanedRawText) return null;
    try {
      return JSON.parse(cleanedRawText);
    } catch (error) {
      return null;
    }
  }, [cleanedRawText]);

  const displayedReadings = structuredReadings?.length
    ? structuredReadings
    : parsedFromRaw?.readings;

  const overallMessage =
    reading?.overall_message ??
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
            <div>
              <h1 className="text-2xl font-bold">Tarot Reading</h1>
              <p className="text-sm opacity-70">
                Bốc 3 lá bài ứng với 3 câu hỏi của bạn (lá có thể ngửa hoặc ngược), sau đó nhận thông điệp và lời khuyên.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Lá bài đã bốc</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {drawnCards.map((card, index) => (
                  <div key={index} className="tarot-card-slot">
                    <div className={`tarot-card ${isRevealing ? "tarot-card--flip" : ""}`}>
                      <img
                        src={card ? card.src : cardBackImg}
                        alt={card ? card.name : "Card back"}
                        className={`tarot-card__image ${card?.reversed ? "rotate-180" : ""}`}
                      />
                    </div>
                    <p className="text-center text-sm font-medium mt-2 min-h-5">
                      {card ? `${card.name}${card.reversed ? " (reversed)" : ""}` : "Chưa bốc"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Câu hỏi của bạn</h2>
                <p className="text-xs opacity-70 mb-3">
                  Thứ tự câu hỏi sẽ tương ứng với 3 lá bài từ trái sang phải.
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

              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-outline" onClick={handleDrawCards}>
                  <ShuffleIcon className="size-4 mr-2" /> Draw Cards
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? (
                    <>
                      <LoaderIcon className="size-4 mr-2 animate-spin" /> Getting Reading...
                    </>
                  ) : (
                    "Get Reading"
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="alert alert-warning">
                  <span>{errorMsg}</span>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  <span>{error?.response?.data?.message || "Không thể lấy kết quả, thử lại."}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {reading && (
          <div className="card bg-base-200 shadow">
            <div className="card-body space-y-4">
              <h2 className="text-xl font-semibold">Thông điệp dành cho bạn</h2>
              {displayedReadings?.length ? (
                <>
                  <div className="space-y-3">
                    {displayedReadings.map((item, index) => {
                      const baseName = String(item.card || "").replace(/\s*\(reversed\)\s*$/i, "");
                      const matched = deck.find((card) => card.name === baseName);
                      const reversed = /\(reversed\)/i.test(String(item.card || ""));

                      return (
                        <div key={index} className="p-4 border border-base-300 rounded bg-base-100">
                          <div className="flex items-start gap-3">
                            {matched && (
                              <img
                                src={matched.src}
                                alt={item.card}
                                className={`w-16 h-24 object-cover rounded ${reversed ? "rotate-180" : ""}`}
                              />
                            )}
                            <div>
                              <p className="text-sm opacity-70">Q{index + 1}: {item.question}</p>
                              <p className="font-semibold mt-1">Card: {item.card}</p>
                              <p className="mt-1">{item.message}</p>
                              <p className="mt-1 text-primary">Advice: {item.advice}</p>
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
