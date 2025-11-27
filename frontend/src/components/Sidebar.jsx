import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
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
  ShieldCheckIcon,
  ShieldIcon,
  SmartphoneIcon,
  UsersIcon,
} from "lucide-react";
import logo from "../pictures/others/LofiTalk_logo.png";
import { useTranslation } from "../languages/useTranslation";
import usePendingNotifications from "../hooks/usePendingNotifications";
import useUnreadChats from "../hooks/useUnreadChats";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();
  const { hasPending } = usePendingNotifications();
  const { hasUnread } = useUnreadChats();
  const isChatRoute =
    currentPath === "/chats" || currentPath.startsWith("/chat/");
  const isPlusOrAdmin =
    authUser?.accountType === "plus" || authUser?.accountType === "admin";
  const [openMystic, setOpenMystic] = useState(
    currentPath === "/tarot" || currentPath === "/fortune"
  );
  const [openGames, setOpenGames] = useState(
    currentPath.startsWith("/match-mind") || currentPath.startsWith("/truth-or-liar")
  );

  useEffect(() => {
    if (currentPath === "/tarot" || currentPath === "/fortune") {
      setOpenMystic(true);
    }
    if (currentPath.startsWith("/match-mind") || currentPath.startsWith("/truth-or-liar")) {
      setOpenGames(true);
    }
  }, [currentPath]);

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="LofiTalk logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#FF5E5E] to-[#FF9A9A] tracking-wider">
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
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          to="/"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/" ? "btn-active" : ""
          }`}
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          <span>{t("sidebar.home")}</span>
        </Link>

        <Link
          to="/friends"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/friends" ? "btn-active" : ""
          }`}
        >
          <UsersIcon className="size-5 text-base-content opacity-70" />
          <span>{t("sidebar.friends")}</span>
        </Link>

        <Link
          to="/chats"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            isChatRoute ? "btn-active" : ""
          }`}
        >
          <span className="relative">
            <MessageSquareIcon className="size-5 text-base-content opacity-70" />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 block size-2 rounded-full bg-error" />
            )}
          </span>
          <span>{t("sidebar.chat")}</span>
        </Link>

        <Link
          to="/notifications"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/notifications" ? "btn-active" : ""
          }`}
        >
          <span className="relative">
            <BellIcon className="size-5 text-base-content opacity-70" />
            {hasPending && (
              <span className="absolute -top-0.5 -right-0.5 block size-2 rounded-full bg-error" />
            )}
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
              className={`size-4 transition-transform ${
                openMystic ? "rotate-180" : ""
              }`}
            />
          </button>

          {openMystic && (
            <div className="pl-8 space-y-1">
              <Link
                to="/tarot"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/tarot" ? "btn-active" : ""
                }`}
              >
                <Wand2Icon className="size-4 text-base-content opacity-70" />
                <span>{t("sidebar.tarot")}</span>
              </Link>

              <Link
                to="/fortune"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/fortune" ? "btn-active" : ""
                }`}
              >
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
              <Gamepad2Icon className="size-5 text-base-content opacity-70" />
              <span>{t("sidebar.games")}</span>
            </div>
            <ChevronDownIcon
              className={`size-4 transition-transform ${
                openGames ? "rotate-180" : ""
              }`}
            />
          </button>

          {openGames && (
            <div className="pl-8 space-y-1">
              <Link
                to="/match-mind"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/match-mind" ? "btn-active" : ""
                }`}
              >
                <HeartHandshakeIcon className="size-4 text-base-content opacity-70" />
                <span>{t("sidebar.matchMind")}</span>
              </Link>
              <Link
                to="/truth-or-liar"
                className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                  currentPath === "/truth-or-liar" ? "btn-active" : ""
                }`}
              >
                <DramaIcon className="size-4 text-base-content opacity-70" />
                <span>{t("sidebar.truthOrLiar")}</span>
              </Link>
            </div>
          )}
        </div>

        {authUser?.accountType === "admin" && (
          <Link
            to="/admin"
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
              currentPath === "/admin" ? "btn-active" : ""
            }`}
          >
            <ShieldIcon className="size-5 text-base-content opacity-70" />
            <span>{t("sidebar.admin")}</span>
          </Link>
        )}

        <Link
          to="/mobile-app"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/mobile-app" ? "btn-active" : ""
          }`}
        >
          <SmartphoneIcon className="size-5 text-base-content opacity-70" />
          <span>{t("sidebar.mobileApp.linkLabel")}</span>
        </Link>
      </nav>

      {/* USER PROFILE SECTION */}
      <div className="border-t border-base-300 p-4 mt-auto w-full">
        <Link to="/" className="flex items-center gap-3 hover:text-primary">
          <div className="avatar">
            <div className="w-10 rounded-full ring ring-primary/20">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              Online
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};
export default Sidebar;

