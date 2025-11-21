import { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import usePendingNotifications from "../hooks/usePendingNotifications";
import useNotificationSound from "../hooks/useNotificationSound";

const Layout = ({ children, showSidebar = false }) => {
  const { pendingCount, acceptedCount, declinedCount } = usePendingNotifications();
  const playNotificationSound = useNotificationSound();
  const previousNotificationTotal = useRef(null);

  useEffect(() => {
    const totalNotifications = pendingCount + acceptedCount + declinedCount;

    if (previousNotificationTotal.current === null) {
      previousNotificationTotal.current = totalNotifications;
      return;
    }

    if (totalNotifications > previousNotificationTotal.current) {
      playNotificationSound();
    }

    previousNotificationTotal.current = totalNotifications;
  }, [pendingCount, acceptedCount, declinedCount, playNotificationSound]);

  return (
    <div className="min-h-screen">
      <div className="flex">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col">
          <Navbar />

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};
export default Layout;
