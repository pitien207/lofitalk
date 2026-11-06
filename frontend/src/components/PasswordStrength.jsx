import { useTranslation } from "../languages/useTranslation";
import { scorePassword } from "../utils/passwordStrength";

const LEVELS = [
  { key: "tooShort", color: "bg-error", text: "text-error" },
  { key: "weak", color: "bg-error", text: "text-error" },
  { key: "fair", color: "bg-warning", text: "text-warning" },
  { key: "good", color: "bg-info", text: "text-info" },
  { key: "strong", color: "bg-success", text: "text-success" },
];

const PasswordStrength = ({ password }) => {
  const { t } = useTranslation();
  if (!password) return null;

  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              score >= step ? level.color : "bg-base-300"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${level.text}`}>
        {t("passwordField.strengthLabel")}: {t(`passwordField.levels.${level.key}`)}
        {score < 3 && (
          <span className="text-base-content/70"> · {t("passwordField.hint")}</span>
        )}
      </p>
    </div>
  );
};

export default PasswordStrength;
