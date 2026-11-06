import { create } from "zustand";

const THEME_KEY = "lofitalk-theme";
const LEGACY_THEME_KEY = "streamify-theme"; // older builds; migrated on first read

const readTheme = () => {
  try {
    const current = localStorage.getItem(THEME_KEY);
    if (current) return current;
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy) {
      localStorage.setItem(THEME_KEY, legacy);
      localStorage.removeItem(LEGACY_THEME_KEY);
      return legacy;
    }
  } catch {
    // storage unavailable (private mode): fall back to the default theme
  }
  return "coffee";
};

export const useThemeStore = create((set) => ({
  theme: readTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore: the theme still applies for this session
    }
    set({ theme });
  },
}));
