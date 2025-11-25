import { useQuery } from "@tanstack/react-query";
import { getAdminNotifications, getFriendRequests } from "../lib/api";

const usePendingNotifications = () => {
  const { data } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    staleTime: 30 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: true,
  });

  const { data: adminNotifications } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: getAdminNotifications,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    retry: 1,
  });

  const pendingCount = data?.incomingReqs?.length || 0;
  const acceptedCount = data?.acceptedReqs?.length || 0;
  const declinedCount = data?.declinedReqs?.length || 0;
  const adminCount = Array.isArray(adminNotifications)
    ? adminNotifications.length
    : adminNotifications?.notifications?.length || 0;

  const hasPending = pendingCount + acceptedCount + declinedCount + adminCount > 0;
  return { hasPending, pendingCount, acceptedCount, declinedCount, adminCount };
};

export default usePendingNotifications;
