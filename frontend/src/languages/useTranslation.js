import { useCallback } from "react";
import { useLanguageStore } from "../store/useLanguageStore";
import { FALLBACK_LANGUAGE } from "./translations";

const getValueFromPath = (obj, path) =>
  path.split(".").reduce((acc, key) => acc?.[key], obj);

const isCorruptedString = (value) =>
  typeof value === "string" && value.includes("�");

const interpolate = (value, vars) => {
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  );
};

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const dictionary = useLanguageStore((state) => state.dictionaries[language]);
  const fallback = useLanguageStore(
    (state) => state.dictionaries[FALLBACK_LANGUAGE]
  );

  // Stable between renders (until the language changes), so it is safe in hook deps.
  const t = useCallback(
    (path, vars = {}) => {
      const value = getValueFromPath(dictionary, path);
      if (value !== undefined && !isCorruptedString(value)) {
        return interpolate(value, vars);
      }

      const fallbackValue = getValueFromPath(fallback, path);
      if (fallbackValue !== undefined) {
        return interpolate(fallbackValue, vars);
      }

      return value !== undefined ? interpolate(value, vars) : path;
    },
    [dictionary, fallback]
  );

  return { t, language, setLanguage };
};
