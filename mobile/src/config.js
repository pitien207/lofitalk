import Constants from "expo-constants";

// Single place for every server URL used by the app.
// Production backend (web, API, Socket.IO and avatar images share one origin).
const DEFAULT_SERVER_URL = "https://lofitalk.nghiapham.org";

// Local development: set EXPO_PUBLIC_SERVER_URL in mobile/.env, e.g. http://192.168.1.15:5001
export const SERVER_URL = (
  process.env.EXPO_PUBLIC_SERVER_URL || DEFAULT_SERVER_URL
).replace(/\/+$/, "");

export const API_BASE_URL = `${SERVER_URL}/api`;
export const SOCKET_URL = SERVER_URL;
export const STATIC_BASE_URL = SERVER_URL;

// Version shown to the server's update check (GET /api/meta/version).
export const APP_VERSION =
  process.env.EXPO_PUBLIC_MOBILE_APP_VERSION ||
  Constants.expoConfig?.version ||
  null;

// Link opened by the "Download update" button on the update-required screen.
export const UPDATE_URL =
  process.env.EXPO_PUBLIC_MOBILE_UPDATE_URL ||
  Constants.expoConfig?.extra?.mobileUpdateUrl ||
  null;
