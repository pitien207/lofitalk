import { create } from "zustand";

// Desktop (lg+): the sidebar can be hidden; the choice is remembered per browser.
// Phones/tablets (< lg): the sidebar is an off-canvas drawer, closed by default.
const COLLAPSED_KEY = "lofitalk-sidebar-collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

export const DESKTOP_QUERY = "(min-width: 1024px)"; // Tailwind `lg`

export const useSidebarStore = create((set, get) => ({
  collapsed: readCollapsed(),
  mobileOpen: false,
  setCollapsed: (collapsed) => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // storage unavailable: the choice still applies for this session
    }
    set({ collapsed });
  },
  openMobile: () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
  // One button for both layouts: hide/show on desktop, open/close the drawer on phones.
  toggle: () => {
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia?.(DESKTOP_QUERY).matches;
    if (isDesktop) {
      get().setCollapsed(!get().collapsed);
    } else {
      set({ mobileOpen: !get().mobileOpen });
    }
  },
}));
