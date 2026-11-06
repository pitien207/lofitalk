import { useEffect, useState } from "react";
import { BellIcon, BellOffIcon, LoaderIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "../languages/useTranslation";
import {
  disablePush,
  enablePush,
  getPushState,
  isIosBrowserTab,
} from "../utils/pushNotifications";

// Settings card: browser notifications for new messages while LofiTalk is closed.
const PushNotificationsToggle = () => {
  const { t } = useTranslation();
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPushState()
      .then((value) => active && setState(value))
      .catch(() => active && setState("unavailable"));
    return () => {
      active = false;
    };
  }, []);

  // Nothing to offer when the server has push turned off.
  if (state === "loading" || state === "unavailable") return null;

  const enabled = state === "enabled";

  const toggle = async () => {
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
        setState("disabled");
        toast.success(t("pushNotifications.disabledToast"));
      } else {
        await enablePush();
        setState("enabled");
        toast.success(t("pushNotifications.enabledToast"));
      }
    } catch (error) {
      if (error?.message === "denied") {
        setState("denied");
      } else if (error?.message !== "dismissed") {
        toast.error(t("pushNotifications.error"));
      }
    } finally {
      setBusy(false);
    }
  };

  let hint = t("pushNotifications.description");
  if (state === "unsupported") {
    hint = isIosBrowserTab() ? t("pushNotifications.iosHint") : t("pushNotifications.unsupported");
  } else if (state === "denied") {
    hint = t("pushNotifications.denied");
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {enabled ? (
              <BellIcon className="size-5 text-primary" aria-hidden="true" />
            ) : (
              <BellOffIcon className="size-5 opacity-70" aria-hidden="true" />
            )}
            {t("pushNotifications.title")}
          </h3>
          <p className="text-sm text-base-content/70" id="push-hint">
            {hint}
          </p>
        </div>
        {(state === "enabled" || state === "disabled") && (
          <label className="label cursor-pointer gap-3 self-start sm:self-center">
            <span className="label-text">
              {enabled ? t("pushNotifications.on") : t("pushNotifications.off")}
            </span>
            {busy ? (
              <LoaderIcon className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={enabled}
                onChange={toggle}
                aria-describedby="push-hint"
                data-testid="push-toggle"
              />
            )}
          </label>
        )}
      </div>
    </div>
  );
};

export default PushNotificationsToggle;
