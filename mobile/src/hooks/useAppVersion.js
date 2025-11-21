import { useCallback, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import { fetchMobileAppVersion } from "../services/metaService";

const CURRENT_APP_VERSION =
  process.env.EXPO_PUBLIC_MOBILE_APP_VERSION ||
  Constants.expoConfig?.version ||
  null;

const UPDATE_URL =
  process.env.EXPO_PUBLIC_MOBILE_UPDATE_URL ||
  Constants.expoConfig?.extra?.mobileUpdateUrl ||
  null;

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
