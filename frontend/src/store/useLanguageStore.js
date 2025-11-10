import { create } from "zustand";

const STORAGE_KEY = "lofitalk-language";
const defaultLanguage =
  typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY) || "Vietnamese"
    : "Vietnamese";

export const useLanguageStore = create((set) => ({
  language: defaultLanguage,
  setLanguage: (language) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language);
    }
    set({ language });
  },
}));
