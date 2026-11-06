import { Link, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  ChevronDownIcon,
  CookieIcon,
  HeartHandshakeIcon,
  MoonStarIcon,
  Wand2Icon,
  HomeIcon,
  MessageSquareIcon,
  CrownIcon,
  Gamepad2Icon,
  DramaIcon,
  PanelLeftCloseIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SmartphoneIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import logo from "../pictures/others/LofiTalk_logo.png";
import { useTranslation } from "../languages/useTranslation";
import usePendingNotifications from "../hooks/usePendingNotifications";
import useUnreadChats from "../hooks/useUnreadChats";
import usePendingReports from "../hooks/usePendingReports";
import { useGameInvitesStore } from "../store/useGameInvitesStore";
import { DESKTOP_QUERY, useSidebarStore } from "../store/useSidebarStore";

const getIsDesktop = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.(DESKTOP_QUERY).matches);

const itemClass = (active) =>
  `btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${active ? "btn-active" : ""}`;

const Dot = () => (
  <span className="absolute -top-0.5 -right-0.5 block size-2 rounded-full bg-error" />
);

/**
 * Desktop (lg+): sticky column that can be hidden (state in useSidebarStore, remembered).
 * Phones/tablets: off-canvas drawer opened from the navbar menu button.
 */
const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();
  const { hasPending } = usePendingNotifications();
  const { hasUnread } = useUnreadChats();
  const { pendingReportCount } = usePendingReports();
  const hasMatchMindInvites = useGameInvitesStore(
    (state) => state.invites.matchmind.length > 0
  );
  const hasTruthOrLieInvites = useGameInvitesStore(
    (state) => state.invites.truthlie.length > 0
  );
  const hasAnyGameInvite = hasMatchMindInvites || hasTruthOrLieInvites;
  const isChatRoute =
    currentPath === "/chats" || currentPath.startsWith("/chat/");
  const [openMystic, setOpenMystic] = useState(
    currentPath === "/tarot" || currentPath === "/fortune"
  );
  const [openGames, setOpenGames] = useState(
    currentPath.startsWith("/match-mind") || currentPath.startsWith("/truth-or-liar")
  );

  const collapsed = useSidebarStore((state) => state.collapsed);
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const setCollapsed = useSidebarStore((state) => state.setCollapsed);
  const closeMobile = useSidebarStore((state) => state.closeMobile);
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);
  const closeButtonRef = useRef(null);
  const drawerOpen = mobileOpen && !isDesktop;

  useEffect(() => {
    const media = window.matchMedia?.(DESKTOP_QUERY);
    if (!media) return undefined;
    const handleChange = (event) => {
      setIsDesktop(event.matches);
      if (event.matches) closeMobile();
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [closeMobile]);

  // Navigating from the drawer closes it.
  useEffect(() => {
    closeMobile();
  }, [currentPath, closeMobile]);

  // While the drawer is open: Escape closes it, the page behind does not scroll,
  // and focus moves into the drawer.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMobile();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen, closeMobile]);

  useEffect(() => {
    if (currentPath === "/tarot" || currentPath === "/fortune") {
      setOpenMystic(true);
    }
    if (currentPath.startsWith("/match-mind") || currentPath.startsWith("/truth-or-liar")) {
      setOpenGames(true);
    }
  }, [currentPath]);

  return (
    <>
      {/* Backdrop behind the phone drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        aria-label={t("a11y.mainMenu")}
        inert={!isDesktop && !mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-base-300 bg-base-200 shadow-2xl transition-transform duration-200 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none lg:transition-none ${
          collapsed ? "lg:hidden" : "lg:flex"
        }`}
      >
        <div className="flex min-h-16 items-center justify-between gap-2 border-b border-base-300 py-3 pl-5 pr-3">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src={logo}
              alt="LofiTalk logo"
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <span className="text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#FF5E5E] to-[#FF9A9A] tracking-wider">
              LofiTalk
            </span>
            {authUser?.accountType === "admin" && (
              <span className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/30 p-1">
                <ShieldCheckIcon className="size-4" />
              </span>
            )}
            {authUser?.accountType === "plus" && (
              <span className="inline-flex items-center justify-center rounded-full bg-secondary/15 text-secondary border border-secondary/30 p-1">
                <CrownIcon className="size-4" />
              </span>
            )}
          </Link>

          <button
            ref={closeButtonRef}
            type="button"
            className="btn btn-ghost btn-circle btn-sm shrink-0 lg:hidden"
            onClick={closeMobile}
            aria-label={t("a11y.closeMenu")}
            title={t("a11y.closeMenu")}
          >
            <XIcon className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm shrink-0 hidden lg:inline-flex"
            onClick={() => setCollapsed(true)}
            aria-label={t("a11y.hideSidebar")}
            title={t("a11y.hideSidebar")}
          >
            <PanelLeftCloseIcon className="size-5 opacity-70" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-4">
          <Link to="/" className={itemClass(currentPath === "/")}>
            <HomeIcon className="size-5 text-base-content opacity-70" />
            <span>{t("sidebar.home")}</span>
          </Link>

          <Link to="/friends" className={itemClass(currentPath === "/friends")}>
            <UsersIcon className="size-5 text-base-content opacity-70" />
            <span>{t("sidebar.friends")}</span>
          </Link>

          <Link to="/chats" className={itemClass(isChatRoute)}>
            <span className="relative">
              <MessageSquareIcon className="size-5 text-base-content opacity-70" />
              {hasUnread && <Dot />}
            </span>
            <span>{t("sidebar.chat")}</span>
          </Link>

          <Link to="/notifications" className={itemClass(currentPath === "/notifications")}>
            <span className="relative">
              <BellIcon className="size-5 text-base-content opacity-70" />
              {hasPending && <Dot />}
            </span>
            <span>{t("sidebar.notifications")}</span>
          </Link>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setOpenMystic((prev) => !prev)}
              className="btn btn-ghost justify-between w-full px-3 normal-case"
              aria-expanded={openMystic}
            >
              <div className="flex items-center gap-3">
                <MoonStarIcon className="size-5 text-base-content opacity-70" />
                <span>{t("sidebar.mystic")}</span>
              </div>
              <ChevronDownIcon
                className={`size-4 transition-transform ${openMystic ? "rotate-180" : ""}`}
              />
            </button>

            {openMystic && (
              <div className="pl-8 space-y-1">
                <Link to="/tarot" className={itemClass(currentPath === "/tarot")}>
                  <Wand2Icon className="size-4 text-base-content opacity-70" />
                  <span>{t("sidebar.tarot")}</span>
                </Link>

                <Link to="/fortune" className={itemClass(currentPath === "/fortune")}>
                  <CookieIcon className="size-4 text-base-content opacity-70" />
                  <span>{t("sidebar.fortune.linkLabel")}</span>
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setOpenGames((prev) => !prev)}
              className="btn btn-ghost justify-between w-full px-3 normal-case"
              aria-expanded={openGames}
            >
              <div className="flex items-center gap-3">
                <span className="relative">
                  <Gamepad2Icon className="size-5 text-base-content opacity-70" />
                  {hasAnyGameInvite && <Dot />}
                </span>
                <span>{t("sidebar.games")}</span>
              </div>
              <ChevronDownIcon
                className={`size-4 transition-transform ${openGames ? "rotate-180" : ""}`}
              />
            </button>

            {openGames && (
              <div className="pl-8 space-y-1">
                <Link to="/match-mind" className={itemClass(currentPath === "/match-mind")}>
                  <span className="relative">
                    <HeartHandshakeIcon className="size-4 text-base-content opacity-70" />
                    {hasMatchMindInvites && <Dot />}
                  </span>
                  <span>{t("sidebar.matchMind")}</span>
                </Link>
                <Link
                  to="/truth-or-liar"
                  className={itemClass(currentPath === "/truth-or-liar")}
                >
                  <span className="relative">
                    <DramaIcon className="size-4 text-base-content opacity-70" />
                    {hasTruthOrLieInvites && <Dot />}
                  </span>
                  <span>{t("sidebar.truthOrLiar")}</span>
                </Link>
              </div>
            )}
          </div>

          {authUser?.accountType === "admin" && (
            <Link to="/admin" className={itemClass(currentPath === "/admin")}>
              <span className="relative">
                <ShieldIcon className="size-5 text-base-content opacity-70" />
                {pendingReportCount > 0 && <Dot />}
              </span>
              <span>{t("sidebar.admin")}</span>
            </Link>
          )}

          <Link to="/mobile-app" className={itemClass(currentPath === "/mobile-app")}>
            <SmartphoneIcon className="size-5 text-base-content opacity-70" />
            <span>{t("sidebar.mobileApp.linkLabel")}</span>
          </Link>
        </nav>

        {/* USER PROFILE SECTION */}
        <div className="mt-auto w-full border-t border-base-300 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link to="/" className="flex items-center gap-3 hover:text-primary">
            <div className="avatar">
              <div className="w-10 rounded-full ring ring-primary/20">
                <img src={authUser?.profilePic} alt="User Avatar" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{authUser?.fullName}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="size-2 rounded-full bg-success inline-block" />
                Online
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
