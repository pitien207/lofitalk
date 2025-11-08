import { Link } from "react-router";
import { UsersIcon, BellIcon, MessageSquareIcon } from "lucide-react";

const HomePage = () => {
  return (
    <div className="p-6 lg:p-10">
      <div className="container mx-auto max-w-4xl">
        <div className="card bg-base-200 shadow-md">
          <div className="card-body space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome to LofiTalk
            </h1>
            <p className="opacity-80">
              Jump into your language exchange. Manage your friends, discover
              new partners, and check notifications.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <Link to="/friends" className="btn btn-primary w-full">
                <UsersIcon className="size-4 mr-2" />
                Go to Friends
              </Link>
              <Link to="/notifications" className="btn btn-outline w-full">
                <BellIcon className="size-4 mr-2" />
                Notifications
              </Link>
              <Link to="/friends" className="btn btn-ghost w-full">
                <MessageSquareIcon className="size-4 mr-2" />
                Start a Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
