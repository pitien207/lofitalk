import { useQuery } from "@tanstack/react-query";
import { getPendingReportCount } from "../lib/api";
import useAuthUser from "./useAuthUser";
import { useRealtimeStore } from "../store/useRealtimeStore";

const usePendingReports = () => {
  const { authUser } = useAuthUser();
  const isAdmin = authUser?.accountType === "admin";
  const paused = useRealtimeStore((state) => state.paused);

  const { data } = useQuery({
    queryKey: ["adminPendingReports"],
    queryFn: getPendingReportCount,
    enabled: isAdmin,
    staleTime: 60 * 1000,
    refetchInterval: paused ? false : 60 * 1000,
    refetchIntervalInBackground: true,
  });

  return { pendingReportCount: data?.count || 0 };
};

export default usePendingReports;
