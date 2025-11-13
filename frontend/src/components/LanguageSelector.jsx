import { LanguagesIcon } from "lucide-react";
import { useTranslation } from "../languages/useTranslation";

const LANGUAGE_OPTIONS = [
  { value: "Vietnamese", label: "Tiếng Việt", short: "VI" },
  { value: "English", label: "English", short: "EN" },
];

const LanguageSelector = ({ className = "" }) => {
  const { language, setLanguage } = useTranslation();

  const activeOption =
    LANGUAGE_OPTIONS.find((option) => option.value === language) ||
    LANGUAGE_OPTIONS[0];

  return (
    <div
      className={`dropdown dropdown-end relative z-20 ${className}`}
    >
      <label
        tabIndex={0}
        className="btn btn-sm btn-ghost gap-2 border border-primary/30 bg-base-100/80 hover:border-primary/60 transition rounded-full px-3"
      >
        <LanguagesIcon className="size-4 text-primary" />
        <span className="text-sm font-semibold tracking-wide">
          {activeOption.short}
        </span>
      </label>

      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-2xl w-40 border border-base-200"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              className={`rounded-lg ${
                option.value === language
                  ? "bg-primary/10 text-primary font-semibold"
                  : ""
              }`}
              onClick={() => setLanguage(option.value)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageSelector;
