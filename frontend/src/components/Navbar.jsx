import { useState } from "react";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  LogOutIcon,
  LanguagesIcon,
  PaletteIcon,
  ShipWheelIcon,
  Settings2Icon,
} from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const [activeSetting, setActiveSetting] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // const queryClient = useQueryClient();
  // const { mutate: logoutMutation } = useMutation({
  //   mutationFn: logout,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  Streamify
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to={"/notifications"}>
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>
          </div>

          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-circle"
              onClick={() => {
                setSettingsOpen((prev) => !prev);
                if (settingsOpen) {
                  setActiveSetting(null);
                }
              }}
            >
              <Settings2Icon className="h-5 w-5 text-base-content opacity-70" />
            </button>
            <div
              tabIndex={0}
              onBlur={() => {
                setSettingsOpen(false);
                setActiveSetting(null);
              }}
              className="dropdown-content mt-2 p-3 shadow-2xl bg-base-200 rounded-2xl border border-base-content/10 w-64 space-y-3"
            >
              <div>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-base-content/5"
                  onClick={() =>
                    setActiveSetting((prev) =>
                      prev === "theme" ? null : "theme"
                    )
                  }
                >
                  <PaletteIcon className="size-4 text-primary" />
                  <span className="text-sm font-semibold">Theme</span>
                </button>
                {activeSetting === "theme" && (
                  <div className="mt-2 border border-base-content/10 rounded-xl p-2 max-h-72 overflow-y-auto">
                    <ThemeSelector />
                  </div>
                )}
              </div>
              <div>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-base-content/5"
                  onClick={() =>
                    setActiveSetting((prev) =>
                      prev === "language" ? null : "language"
                    )
                  }
                >
                  <LanguagesIcon className="size-4 text-secondary" />
                  <span className="text-sm font-semibold">Language</span>
                </button>
                {activeSetting === "language" && (
                  <div className="mt-2 border border-base-content/10 rounded-xl p-2 space-y-2">
                    {["Vietnamese", "English", "German"].map((lang) => (
                      <button
                        key={lang}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedLanguage === lang
                            ? "bg-secondary/10 text-secondary"
                            : "hover:bg-base-content/5"
                        }`}
                        onClick={() => setSelectedLanguage(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="avatar">
            <div className="w-9 rounded-full">
              <img
                src={authUser?.profilePic}
                alt="User Avatar"
                rel="noreferrer"
              />
            </div>
          </div>

          {/* Logout button */}
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
