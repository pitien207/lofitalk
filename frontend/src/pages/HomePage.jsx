import { Link } from "react-router";
import { UsersIcon, BellIcon, MessageSquareIcon } from "lucide-react";
import { useTranslation } from "../languages/useTranslation";

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6 lg:p-10">
      <div className="container mx-auto max-w-4xl">
        <div className="card bg-base-200 shadow-md">
          <div className="card-body space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t("home.welcomeTitle")}
            </h1>
            <p className="opacity-80">
              {t("home.welcomeSubtitle")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <Link to="/friends" className="btn btn-primary w-full">
                <UsersIcon className="size-4 mr-2" />
                {t("home.goFriends")}
              </Link>
              <Link to="/notifications" className="btn btn-outline w-full">
                <BellIcon className="size-4 mr-2" />
                {t("home.goNotifications")}
              </Link>
              <Link to="/friends" className="btn btn-ghost w-full">
                <MessageSquareIcon className="size-4 mr-2" />
                {t("home.startChat")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
