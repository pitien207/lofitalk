const LANGUAGE_TO_LOCALE = {
  English: "en",
  Vietnamese: "vi",
};

const TIME_UNITS = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 604800, divisor: 86400, unit: "day" },
  { limit: 2628000, divisor: 604800, unit: "week" }, // approx month
  { limit: 31536000, divisor: 2628000, unit: "month" },
  { limit: Infinity, divisor: 31536000, unit: "year" },
];

export const formatRelativeTimeFromNow = (dateInput, language = "English") => {
  if (!dateInput) return "";

  const parsedDate =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput instanceof Date
        ? dateInput
        : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const diffInSeconds = Math.round((parsedDate.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  const locale = LANGUAGE_TO_LOCALE[language] || "en";
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const { limit, divisor, unit } of TIME_UNITS) {
    if (absSeconds < limit) {
      const value = Math.round(diffInSeconds / divisor) || -1;
      return formatter.format(value, unit);
    }
  }

  return "";
};
