import {
  deletePushSubscription,
  getPushConfig,
  savePushSubscription,
} from "../lib/api";

// Browser push for new chat messages while LofiTalk is closed (public/sw.js).

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

// iPhone/iPad only allow web push for apps added to the home screen.
export const isIosBrowserTab = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.matchMedia?.("(display-mode: standalone)").matches;

export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.warn("Service worker registration failed", error);
  });

  // Notification click while a LofiTalk tab is open: navigate inside the SPA.
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "lofitalk:navigate") return;
    try {
      const target = new URL(event.data.url, window.location.origin);
      if (target.origin !== window.location.origin) return;
      window.history.pushState({}, "", target.pathname + target.search);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      // ignore malformed messages
    }
  });
};

const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const getRegistration = async () => {
  if (!isPushSupported()) return null;
  return (await navigator.serviceWorker.getRegistration()) || null;
};

// "unsupported" | "unavailable" (server has no keys) | "denied" | "enabled" | "disabled"
export const getPushState = async () => {
  if (!isPushSupported()) return "unsupported";
  const config = await getPushConfig().catch(() => ({ enabled: false }));
  if (!config?.enabled) return "unavailable";
  if (Notification.permission === "denied") return "denied";
  const registration = await getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription && Notification.permission === "granted" ? "enabled" : "disabled";
};

export const enablePush = async () => {
  const config = await getPushConfig();
  if (!config?.enabled || !config.publicKey) throw new Error("unavailable");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "denied" : "dismissed");

  const registration =
    (await getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  const expectedKey = urlBase64ToUint8Array(config.publicKey);
  const currentKey = subscription?.options?.applicationServerKey;
  // Server keys changed since this browser subscribed: start over.
  if (
    subscription &&
    currentKey &&
    new Uint8Array(currentKey).toString() !== expectedKey.toString()
  ) {
    await subscription.unsubscribe();
    subscription = null;
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: expectedKey,
    });
  }
  await savePushSubscription(subscription.toJSON());
};

export const disablePush = async () => {
  const registration = await getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await deletePushSubscription(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
};

// After login: if this browser already has a subscription (permission granted
// earlier), it now belongs to the account that is logged in.
export const syncPushSubscription = async () => {
  try {
    if (!isPushSupported() || Notification.permission !== "granted") return;
    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    const config = await getPushConfig();
    if (config?.enabled) await savePushSubscription(subscription.toJSON());
  } catch {
    // best effort
  }
};

// On logout: the next person using this browser must not get our notifications.
export const disablePushOnLogout = async () => {
  try {
    await disablePush();
  } catch {
    // never block logout
  }
};
