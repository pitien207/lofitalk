import { Suspense, useEffect, useRef } from "react";
import { LoaderIcon } from "lucide-react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import usePendingNotifications from "../hooks/usePendingNotifications";
import useNotificationSound from "../hooks/useNotificationSound";

const Layout = ({ children, showSidebar = false }) => {
  const { pendingCount, acceptedCount, declinedCount, adminCount } = usePendingNotifications();
  const playNotificationSound = useNotificationSound();
  const previousNotificationTotal = useRef(null);

  useEffect(() => {
    const totalNotifications = pendingCount + acceptedCount + declinedCount + adminCount;

    if (previousNotificationTotal.current === null) {
      previousNotificationTotal.current = totalNotifications;
      return;
    }

    if (totalNotifications > previousNotificationTotal.current) {
      playNotificationSound();
    }

    previousNotificationTotal.current = totalNotifications;
  }, [pendingCount, acceptedCount, declinedCount, adminCount, playNotificationSound]);

  return (
    <div className="min-h-screen">
      <div className="flex">
        {showSidebar && <Sidebar />}

        {/* min-w-0: wide content (long links, tables) must not stretch the page */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />

          <main className="flex-1 overflow-y-auto">
            {/* Pages are loaded on demand: keep sidebar/navbar while a page chunk loads. */}
            <Suspense
              fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                  <LoaderIcon className="animate-spin size-8 text-primary" />
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};
export default Layout;
