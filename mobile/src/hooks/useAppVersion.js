import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMobileAppVersion } from "../services/metaService";
import { APP_VERSION, UPDATE_URL } from "../config";

const CURRENT_APP_VERSION = APP_VERSION;

const useAppVersion = () => {
  const [status, setStatus] = useState("checking");
  const [serverVersion, setServerVersion] = useState(null);

  const checkVersion = useCallback(async () => {
    setStatus("checking");

    try {
      const requiredVersion = await fetchMobileAppVersion();
      setServerVersion(requiredVersion);

      if (requiredVersion && CURRENT_APP_VERSION) {
        setStatus(
          requiredVersion === CURRENT_APP_VERSION ? "ok" : "blocked"
        );
      } else {
        setStatus("ok");
      }
    } catch (error) {
      console.log("Failed to check app version", error?.message || error);
      setStatus("ok");
    }
  }, []);

  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  return useMemo(
    () => ({
      status,
      requiresUpdate: status === "blocked",
      serverVersion,
      currentVersion: CURRENT_APP_VERSION,
      updateUrl: UPDATE_URL,
      refresh: checkVersion,
    }),
    [checkVersion, serverVersion, status]
  );
};

export default useAppVersion;
