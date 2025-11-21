import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  CookieIcon,
  HomeIcon,
  MessageSquareIcon,
  MoonStarIcon,
  ShieldIcon,
  SmartphoneIcon,
  UsersIcon,
} from "lucide-react";
import logo from "../pictures/others/LofiTalk_logo.png";
import { useTranslation } from "../languages/useTranslation";
import usePendingNotifications from "../hooks/usePendingNotifications";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();
  const { hasPending } = usePendingNotifications();
  const isChatRoute =
    currentPath === "/chats" || currentPath.startsWith("/chat/");

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="LofiTalk logo" className="w-10 h-10 rounded-full object-cover" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#FF5E5E] to-[#FF9A9A] tracking-wider">
            LofiTalk
          </span>
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
          <MessageSquareIcon className="size-5 text-base-content opacity-70" />
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

        <Link
        to="/tarot"
        className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
          currentPath === "/tarot" ? "btn-active" : ""
        }`}
      >
        <MoonStarIcon className="size-5 text-base-content opacity-70" />
        <span>{t("sidebar.tarot")}</span>
      </Link>

        <Link
          to="/fortune"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/fortune" ? "btn-active" : ""
          }`}
        >
          <CookieIcon className="size-5 text-base-content opacity-70" />
          <span>{t("sidebar.fortune.linkLabel")}</span>
        </Link>

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
