import { useLanguageStore } from "../store/useLanguageStore";
import { translations } from "./translations";

const getValueFromPath = (obj, path) =>
  path.split(".").reduce((acc, key) => acc?.[key], obj);

const isCorruptedString = (value) =>
  typeof value === "string" && value.includes("\uFFFD");

const interpolate = (value, vars) => {
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  );
};

export const useTranslation = () => {
  const { language, setLanguage } = useLanguageStore();
  const fallback = translations.English;
  const dictionary = translations[language] || fallback;

  const t = (path, vars = {}) => {
    const value = getValueFromPath(dictionary, path);
    if (value !== undefined && !isCorruptedString(value)) {
      return interpolate(value, vars);
    }

    const fallbackValue = getValueFromPath(fallback, path);
    if (fallbackValue !== undefined) {
      return interpolate(fallbackValue, vars);
    }

    return path;
  };

  return { t, language, setLanguage };
};
