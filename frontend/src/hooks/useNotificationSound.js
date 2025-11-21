import { useCallback } from "react";

const SOUND_URL = new URL(
  "../../assets/sounds/notification.mp3",
  import.meta.url
).href;

let audioInstance = null;

const getAudio = () => {
  if (!audioInstance) {
    audioInstance = new Audio(SOUND_URL);
    audioInstance.preload = "auto";
  }
  return audioInstance;
};

/**
 * Plays a shared notification sound without overlapping multiple plays.
 */
const useNotificationSound = () => {
  const playSound = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;

    // Reuse the same element to avoid stacked playback.
    if (!audio.paused) {
      audio.currentTime = 0;
    }

    audio.play().catch(() => {
      // Ignore autoplay or permission errors.
    });
  }, []);

  return playSound;
};

export default useNotificationSound;
