import { create } from "zustand";

// paused = Socket.IO disconnected and background polling stopped because the user is idle.
export const useRealtimeStore = create((set) => ({
  paused: false,
  setPaused: (paused) => set({ paused }),
}));
