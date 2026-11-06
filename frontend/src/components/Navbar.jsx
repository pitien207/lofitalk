import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  LogOutIcon,
  InfoIcon,
  LanguagesIcon,
  MenuIcon,
  MessageSquareIcon,
  PaletteIcon,
  PanelLeftOpenIcon,
  Settings2Icon,
} from "lucide-react";
import useLogout from "../hooks/useLogout";
import ThemeSelector from "./ThemeSelector";
import { AVAILABLE_LANGUAGES } from "../languages/translations";
import { useTranslation } from "../languages/useTranslation";
import usePendingNotifications from "../hooks/usePendingNotifications";
import useUnreadChats from "../hooks/useUnreadChats";
import { useGameInvitesStore } from "../store/useGameInvitesStore";
import { useSidebarStore } from "../store/useSidebarStore";
import logo from "../pictures/others/LofiTalk_logo.png";

// 40px touch targets on phones (fits a 360px screen), 48px from `sm`.
const ICON_BTN = "btn btn-ghost btn-circle h-10 min-h-10 w-10 sm:h-12 sm:min-h-12 sm:w-12";

const Dot = ({ className = "top-1.5 right-1.5" }) => (
  <span className={`absolute block size-2 rounded-full bg-error ${className}`} />
);

const Navbar = ({ showSidebarToggle = false }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const [activeSetting, setActiveSetting] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const { t, language, setLanguage } = useTranslation();
  const { hasPending } = usePendingNotifications();
  const { hasUnread } = useUnreadChats();
  const hasGameInvite = useGameInvitesStore(
    (state) => state.invites.matchmind.length > 0 || state.invites.truthlie.length > 0
  );
  const { logoutMutation } = useLogout();
  const sidebarCollapsed = useSidebarStore((state) => state.collapsed);
  const mobileSidebarOpen = useSidebarStore((state) => state.mobileOpen);
  const toggleSidebar = useSidebarStore((state) => state.toggle);
  const isChatRoute = currentPath === "/chats" || currentPath.startsWith("/chat/");

  const closeSettings = () => {
    setSettingsOpen(false);
    setActiveSetting(null);
  };

  // Settings menu: close on outside tap/click (phones have no mouseleave), Escape
  // and navigation.
  useEffect(() => {
    if (!settingsOpen) return undefined;
    const closeSettings = () => {
      setSettingsOpen(false);
      setActiveSetting(null);
    };
    const handlePointerDown = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        closeSettings();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeSettings();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    setSettingsOpen(false);
    setActiveSetting(null);
  }, [currentPath]);

  // On desktop the toggle (and the logo) only show while the sidebar is hidden;
  // the sidebar has its own hide button.
  const desktopToggleVisible = showSidebarToggle && sidebarCollapsed;
  const brandVisibility = desktopToggleVisible || !showSidebarToggle ? "flex" : "flex lg:hidden";

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="w-full px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full gap-1 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {showSidebarToggle && (
              <button
                type="button"
                className={`${ICON_BTN} relative ${
                  desktopToggleVisible ? "" : "lg:hidden"
                }`}
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? t("a11y.showSidebar") : t("a11y.openMenu")}
                title={sidebarCollapsed ? t("a11y.showSidebar") : t("a11y.openMenu")}
                aria-controls="app-sidebar"
                aria-expanded={mobileSidebarOpen}
              >
                <MenuIcon className="size-6 lg:hidden" aria-hidden="true" />
                <PanelLeftOpenIcon className="size-5 hidden lg:block opacity-70" aria-hidden="true" />
                {/* Game invites live in the menu: hint at them on the button. */}
                {hasGameInvite && <Dot className="top-2 right-2 lg:hidden" />}
              </button>
            )}

            <Link to="/" className={`${brandVisibility} items-center gap-2 min-w-0`}>
              <img
                src={logo}
                alt=""
                className="size-8 shrink-0 rounded-full object-cover"
              />
              <span className="hidden min-[360px]:inline text-xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#FF5E5E] to-[#FF9A9A] tracking-wider">
                LofiTalk
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-2 ml-auto">
            {/* Chats are the most used page: keep them one tap away on phones. */}
            <Link
              to="/chats"
              className={`${ICON_BTN} relative lg:hidden ${
                isChatRoute ? "btn-active" : ""
              }`}
              title={t("sidebar.chat")}
              aria-label={t("sidebar.chat")}
            >
              <MessageSquareIcon className="size-5 text-base-content opacity-70" aria-hidden="true" />
              {hasUnread && <Dot />}
            </Link>

            <Link
              to={"/notifications"}
              className={`${ICON_BTN} relative`}
              title={t("nav.notifications")}
              aria-label={t("nav.notifications")}
            >
              <BellIcon className="size-5 sm:size-6 text-base-content opacity-70" aria-hidden="true" />
              {hasPending && <Dot />}
            </Link>

            <div ref={settingsRef} className="relative">
              <button
                type="button"
                className={ICON_BTN}
                aria-label={t("a11y.settings")}
                title={t("a11y.settings")}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                onClick={() => (settingsOpen ? closeSettings() : setSettingsOpen(true))}
              >
                <Settings2Icon className="h-5 w-5 text-base-content opacity-70" aria-hidden="true" />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 p-3 shadow-2xl bg-base-200 rounded-2xl border border-base-content/10 w-64 max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain space-y-3">
                  <div>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-content/5"
                      onClick={() =>
                        setActiveSetting((prev) => (prev === "theme" ? null : "theme"))
                      }
                      aria-expanded={activeSetting === "theme"}
                    >
                      <PaletteIcon className="size-4 text-primary" />
                      <span className="text-sm font-semibold">{t("nav.theme")}</span>
                    </button>
                    {activeSetting === "theme" && (
                      <div className="mt-2 border border-base-content/10 rounded-xl p-2 max-h-72 overflow-y-auto">
                        <ThemeSelector />
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-content/5"
                      onClick={() =>
                        setActiveSetting((prev) => (prev === "language" ? null : "language"))
                      }
                      aria-expanded={activeSetting === "language"}
                    >
                      <LanguagesIcon className="size-4 text-secondary" />
                      <span className="text-sm font-semibold">{t("nav.language")}</span>
                    </button>
                    {activeSetting === "language" && (
                      <div className="mt-2 border border-base-content/10 rounded-xl p-2 space-y-2">
                        {AVAILABLE_LANGUAGES.map((lang) => (
                          <button
                            type="button"
                            key={lang.value}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                              language === lang.value
                                ? "bg-secondary/10 text-secondary"
                                : "hover:bg-base-content/5"
                            }`}
                            onClick={() => setLanguage(lang.value)}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-content/5"
                      onClick={() =>
                        setActiveSetting((prev) => (prev === "about" ? null : "about"))
                      }
                      aria-expanded={activeSetting === "about"}
                    >
                      <InfoIcon className="size-4 text-info" />
                      <span className="text-sm font-semibold">{t("nav.about")}</span>
                    </button>
                    {activeSetting === "about" && (
                      <div className="mt-2 border border-base-content/10 rounded-xl p-3 text-sm space-y-1 bg-base-100">
                        <div className="flex justify-between">
                          <span className="opacity-70">{t("nav.version")}</span>
                          <span className="font-medium">v1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-70">{t("nav.developer")}</span>
                          <span className="font-medium">Pitien</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="opacity-70">{t("nav.inspiredBy")}</span>
                          <span className="font-medium text-right">
                            {t("nav.inspiredNames")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* On phones the logout action lives here (saves navbar space). */}
                  <div className="sm:hidden border-t border-base-content/10 pt-2">
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-content/5 text-error"
                      onClick={() => logoutMutation()}
                    >
                      <LogOutIcon className="size-4" aria-hidden="true" />
                      <span className="text-sm font-semibold">{t("a11y.logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link to="/" className="avatar ml-1" aria-label={t("a11y.myProfile")}>
              <div className="w-8 sm:w-9 rounded-full ring ring-primary/20">
                <img src={authUser?.profilePic} alt="" />
              </div>
            </Link>

            <button
              type="button"
              className={`${ICON_BTN} hidden sm:inline-flex`}
              onClick={() => logoutMutation()}
              aria-label={t("a11y.logout")}
              title={t("a11y.logout")}
            >
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
