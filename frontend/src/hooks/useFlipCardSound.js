import { useCallback } from "react";

const FLIP_SOUND_URL = new URL(
  "../../assets/sounds/flipCard.mp3",
  import.meta.url
).href;

let flipAudioInstance = null;

const getFlipAudio = () => {
  if (!flipAudioInstance) {
    flipAudioInstance = new Audio(FLIP_SOUND_URL);
    flipAudioInstance.preload = "auto";
  }
  return flipAudioInstance;
};

/**
 * Plays the tarot flip sound without stacking overlapping audio.
 */
const useFlipCardSound = () => {
  const playFlipSound = useCallback(() => {
    const audio = getFlipAudio();
    if (!audio) return;

    if (!audio.paused) {
      audio.currentTime = 0;
    }

    audio.play().catch(() => {
      // Autoplay or permission issues can be ignored.
    });
  }, []);

  return playFlipSound;
};

export default useFlipCardSound;
