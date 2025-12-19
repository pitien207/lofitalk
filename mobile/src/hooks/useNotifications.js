import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHAT_CHANNEL_ID = "chat-messages";
const isExpoGo = Constants.executionEnvironment === "storeClient";

const useNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState("checking");
  const [isGranted, setIsGranted] = useState(false);

  const ensurePermission = useCallback(async () => {
    if (isExpoGo) {
      setIsGranted(false);
      setPermissionStatus("unsupported");
      return;
    }

    setPermissionStatus("checking");
    try {
      const settings = await Notifications.getPermissionsAsync();
      let status = settings?.status;

      if (status !== "granted") {
        const response = await Notifications.requestPermissionsAsync();
        status = response?.status;
      }

      const granted = status === "granted";
      setIsGranted(granted);
      setPermissionStatus(granted ? "granted" : "denied");

      if (granted && Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(CHAT_CHANNEL_ID, {
          name: "Tin nhắn",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FFA384",
          sound: "default",
        });
      }
    } catch (_error) {
      setIsGranted(false);
      setPermissionStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!isExpoGo) {
      ensurePermission();
    } else {
      setPermissionStatus("unsupported");
    }
  }, [ensurePermission, isExpoGo]);

  const presentMessageNotification = useCallback(
    async ({ title, body, data } = {}) => {
      if (!isGranted || isExpoGo) return false;
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title || "Tin nhắn mới",
            body: body || "Bạn có tin nhắn mới",
            data,
            sound: "default",
            ...(Platform.OS === "android"
              ? { channelId: CHAT_CHANNEL_ID }
              : {}),
          },
          trigger: null,
        });
        return true;
      } catch (_error) {
        return false;
      }
    },
    [isGranted]
  );

  return {
    permissionStatus,
    isGranted,
    presentMessageNotification,
    requestPermission: ensurePermission,
    isExpoGo,
  };
};

export default useNotifications;
