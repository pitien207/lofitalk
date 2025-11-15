import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../languages/useTranslation";

const COOKIE_HALF_BASE =
  "absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 shadow-2xl transition-all duration-500 ease-out";

const SPARKLES = [
  { top: "12%", left: "20%", delay: "0s" },
  { top: "10%", right: "18%", delay: "0.15s" },
  { bottom: "18%", left: "12%", delay: "0.25s" },
  { bottom: "16%", right: "12%", delay: "0.35s" },
  { top: "50%", left: "5%", delay: "0.45s" },
  { top: "45%", right: "6%", delay: "0.55s" },
];

const CONFETTI_COLORS = ["#FDBA74", "#F87171", "#FDE68A", "#34D399", "#A78BFA", "#F472B6"];

const FortuneCookie = () => {
  const { t } = useTranslation();
  const fortunesRaw = t("sidebar.fortune.messages");
  const fortunes = Array.isArray(fortunesRaw) ? fortunesRaw : [];

  const [phase, setPhase] = useState("idle"); // idle, cracking, open
  const [fortuneSeed, setFortuneSeed] = useState(0);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const timersRef = useRef({ crack: null, confetti: null });

  const fortuneText = useMemo(() => {
    if (!fortunes.length) return t("sidebar.fortune.fallback");
    const index = Math.floor(Math.random() * fortunes.length);
    return fortunes[index];
  }, [fortunes, fortuneSeed, t]);

  const confettiPieces = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.3;
      const duration = 1.2 + Math.random() * 0.6;
      const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
      const rotation = Math.random() * 180;
      return {
        id: `${confettiSeed}-${index}`,
        left: `${left}%`,
        delay,
        duration,
        color,
        rotation,
      };
    });
  }, [confettiSeed]);

  useEffect(() => {
    return () => {
      if (timersRef.current.crack) clearTimeout(timersRef.current.crack);
      if (timersRef.current.confetti) clearTimeout(timersRef.current.confetti);
    };
  }, []);

  const isCracking = phase === "cracking";
  const isOpen = phase === "open";

  const handleCookieClick = () => {
    if (phase !== "idle") return;
    setPhase("cracking");
    if (timersRef.current.crack) clearTimeout(timersRef.current.crack);
    timersRef.current.crack = setTimeout(() => {
      setPhase("open");
      setConfettiSeed((prev) => prev + 1);
      setShowConfetti(true);
      if (timersRef.current.confetti) clearTimeout(timersRef.current.confetti);
      timersRef.current.confetti = setTimeout(() => {
        setShowConfetti(false);
      }, 1400);
    }, 650);
  };

  const handleReset = () => {
    if (isCracking) return;
    setPhase("idle");
    setShowConfetti(false);
    setFortuneSeed((prev) => prev + 1);
  };

  const leftHalfStyles = `${COOKIE_HALF_BASE} origin-right ${
    isOpen ? "-translate-x-[90%] -rotate-12" : "-translate-x-1/2"
  } ${isCracking ? "-translate-x-[65%] -rotate-6" : ""}`;
  const rightHalfStyles = `${COOKIE_HALF_BASE} origin-left ${
    isOpen ? "translate-x-[10%] rotate-12" : "-translate-x-1/2"
  } ${isCracking ? "translate-x-0 rotate-6" : ""}`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/70 via-orange-50 to-rose-50 p-8 shadow-lg">
      <div className="pointer-events-none absolute inset-10 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold text-amber-900">{t("sidebar.fortune.title")}</p>
          <p className="text-sm text-amber-800/80 max-w-xl">{t("sidebar.fortune.subtitle")}</p>
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleCookieClick}
            className={`relative flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 shadow-2xl transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
              isCracking ? "scale-110" : ""
            } ${isOpen ? "scale-100" : "hover:scale-105"}`}
            aria-pressed={isOpen}
            aria-label={t("sidebar.fortune.hint")}
          >
            <span
              className={`absolute inset-4 rounded-full bg-amber-50/30 blur-xl transition-all duration-500 ${
                isOpen ? "opacity-60 scale-125" : "opacity-40"
              }`}
            />
            <span
              className={`${leftHalfStyles} bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500`}
              style={{
                clipPath: "polygon(0% 0%, 65% 0%, 45% 100%, 0% 100%)",
              }}
            />
            <span
              className={`${rightHalfStyles} bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400`}
              style={{
                clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 55% 100%)",
              }}
            />

            {SPARKLES.map((sparkle, index) => (
              <span
                key={index}
                className={`absolute block size-3 rounded-full bg-white/80 shadow ${isOpen ? "opacity-0" : "opacity-70"} ${
                  isCracking ? "animate-ping" : ""
                }`}
                style={{
                  ...sparkle,
                  animationDelay: sparkle.delay,
                }}
              />
            ))}

            <div
              className={`absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 transition-all duration-500 ${
                isOpen ? "scale-0 opacity-0" : "scale-100 opacity-90"
              }`}
            />

            <div
              className={`absolute top-1/2 left-1/2 w-40 -translate-x-1/2 -translate-y-1/2 rounded bg-white px-5 py-3 text-center text-sm font-medium text-amber-900 shadow-2xl transition-all duration-500 ${
                isOpen ? "opacity-100 -translate-y-28 rotate-2" : "opacity-0 translate-y-6"
              }`}
            >
              {fortuneText}
            </div>

            {showConfetti &&
              confettiPieces.map((piece) => (
                <span
                  key={piece.id}
                  className="fortune-confetti-piece pointer-events-none absolute block h-2 w-1 rounded-full"
                  style={{
                    left: piece.left,
                    top: "45%",
                    backgroundColor: piece.color,
                    animationDelay: `${piece.delay}s`,
                    animationDuration: `${piece.duration}s`,
                    "--fortune-rotation": `${piece.rotation}deg`,
                  }}
                />
              ))}
          </button>

          <p className="text-xs uppercase tracking-[0.2em] text-amber-600">
            {isOpen ? t("sidebar.fortune.openedHint") : t("sidebar.fortune.hint")}
          </p>

          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white/90 px-6 py-4 text-center text-base text-amber-900 shadow-lg transition-all duration-500">
            <p>{fortuneText}</p>
            <p className="mt-3 text-sm text-amber-600">{t("sidebar.fortune.shareHint")}</p>
          </div>

          {isOpen && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-sm border-0 bg-amber-500 text-white hover:bg-amber-600"
            >
              {t("sidebar.fortune.newFortune")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FortuneCookie;
