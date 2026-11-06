// Idle handling for the realtime connection (Socket.IO + background polling).
// While paused the browser sends nothing, so the server can scale to zero.

// Tab hidden (other tab focused, window minimized) for this long -> pause.
export const HIDDEN_TAB_DISCONNECT_MS = 10 * 60 * 1000; // 10 minutes

// No mouse / keyboard / touch / scroll activity for this long -> pause, even if visible.
export const INACTIVITY_DISCONNECT_MS = 30 * 60 * 1000; // 30 minutes

// Activity is recorded at most once per this interval (cheap event handling).
export const ACTIVITY_THROTTLE_MS = 1000;

// DOM events that count as user activity (and resume a paused connection).
export const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
];
