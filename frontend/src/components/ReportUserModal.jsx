import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../languages/useTranslation";

const ReportUserModal = ({
  isOpen,
  targetUser = null,
  onClose,
  onSubmit,
  isSubmitting = false,
  wordLimit = 120,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMessage("");
    }
  }, [isOpen, targetUser?._id]);

  const wordCount = useMemo(() => {
    if (!message.trim()) return 0;
    return message.trim().split(/\s+/).length;
  }, [message]);

  const isTooLong = wordCount > wordLimit;
  const isDisabled = !message.trim() || isTooLong || isSubmitting;

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isDisabled) return;
    onSubmit?.(message.trim());
  };

  return (
    <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-base-100 shadow-2xl border border-base-300">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold">{t("friends.reportTitle")}</h3>
            {targetUser ? (
              <p className="text-sm text-base-content/70">
                {t("friends.reportTargetLabel", { name: targetUser.fullName })}
              </p>
            ) : null}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        <form className="px-5 py-4 space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-base-content/70">
            {t("friends.reportDescription", { limit: wordLimit })}
          </p>

          <textarea
            className="textarea textarea-bordered w-full h-32"
            placeholder={t("friends.reportPlaceholder")}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-base-content/70">
            <span>
              {t("friends.reportWordCounter", {
                count: wordCount,
                limit: wordLimit,
              })}
            </span>
            {isTooLong && <span className="text-error">{t("friends.reportTooLong")}</span>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              {t("common.cancel") || "Cancel"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isDisabled}>
              {isSubmitting && <span className="loading loading-spinner loading-xs mr-2" />}
              {t("friends.reportSubmit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUserModal;
