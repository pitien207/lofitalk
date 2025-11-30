import { useQuery } from "@tanstack/react-query";
import { getPendingReportCount } from "../lib/api";
import useAuthUser from "./useAuthUser";

const usePendingReports = () => {
  const { authUser } = useAuthUser();
  const isAdmin = authUser?.accountType === "admin";

  const { data } = useQuery({
    queryKey: ["adminPendingReports"],
    queryFn: getPendingReportCount,
    enabled: isAdmin,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
  });

  return { pendingReportCount: data?.count || 0 };
};

export default usePendingReports;
