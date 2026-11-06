import { create } from "zustand";
import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  getHtmlLang,
  isSupportedLanguage,
  loadDictionary,
} from "../languages/translations";

const STORAGE_KEY = "lofitalk-language";

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const applyHtmlLang = (language) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = getHtmlLang(language);
  }
};

export const useLanguageStore = create((set, get) => {
  const ensureDictionary = async (language) => {
    const existing = get().dictionaries[language];
    if (existing) return existing;
    const dictionary = await loadDictionary(language);
    set((state) => ({
      dictionaries: { ...state.dictionaries, [language]: dictionary },
    }));
    return dictionary;
  };

  return {
    language: readStoredLanguage(),
    dictionaries: {},

    // Called once before the first render (main.jsx).
    init: async () => {
      const { language } = get();
      applyHtmlLang(language);
      try {
        await ensureDictionary(language);
      } catch (error) {
        console.error("Failed to load translations", error);
      }
      if (language !== FALLBACK_LANGUAGE) {
        ensureDictionary(FALLBACK_LANGUAGE).catch(() => {});
      }
    },

    // Switches only after the new dictionary is loaded, so the UI never shows raw keys.
    setLanguage: async (language) => {
      if (!isSupportedLanguage(language)) return;
      try {
        await ensureDictionary(language);
      } catch (error) {
        console.error("Failed to load translations", error);
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch {
        // storage may be blocked; the choice still applies to this tab
      }
      applyHtmlLang(language);
      set({ language });
    },
  };
});
