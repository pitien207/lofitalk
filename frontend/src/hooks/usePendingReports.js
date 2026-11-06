import { useQuery } from "@tanstack/react-query";
import { getPendingReportCount } from "../lib/api";
import useAuthUser from "./useAuthUser";
import { useRealtimeStore } from "../store/useRealtimeStore";
import { FALLBACK_REFETCH_MS } from "../constants/realtime";

const usePendingReports = () => {
  const { authUser } = useAuthUser();
  const isAdmin = authUser?.accountType === "admin";
  const paused = useRealtimeStore((state) => state.paused);

  const { data } = useQuery({
    queryKey: ["adminPendingReports"],
    queryFn: getPendingReportCount,
    enabled: isAdmin,
    staleTime: 60 * 1000,
    // New/resolved reports arrive as socket events; this is only a safety net.
    refetchInterval: paused ? false : FALLBACK_REFETCH_MS,
  });

  return { pendingReportCount: data?.count || 0 };
};

export default usePendingReports;
