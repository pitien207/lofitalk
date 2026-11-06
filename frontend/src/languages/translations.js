export const AVAILABLE_LANGUAGES = [
  { value: "English", label: "English", htmlLang: "en" },
  { value: "Vietnamese", label: "Tiếng Việt", htmlLang: "vi" },
];

export const DEFAULT_LANGUAGE = "Vietnamese";
export const FALLBACK_LANGUAGE = "English";

// Each language is its own chunk, so the browser only downloads the one in use
// (plus English as a fallback for missing keys, loaded in the background).
const loaders = {
  English: () => import("./en.js"),
  Vietnamese: () => import("./vi.js"),
};

export const isSupportedLanguage = (language) =>
  Object.prototype.hasOwnProperty.call(loaders, language);

export const loadDictionary = async (language) => {
  const loader = loaders[language] || loaders[FALLBACK_LANGUAGE];
  const mod = await loader();
  return mod.default;
};

export const getHtmlLang = (language) =>
  AVAILABLE_LANGUAGES.find((option) => option.value === language)?.htmlLang ||
  "en";
