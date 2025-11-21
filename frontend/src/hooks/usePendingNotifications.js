import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

const usePendingNotifications = () => {
  const { data } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    staleTime: 30 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: true,
  });

  const pendingCount = data?.incomingReqs?.length || 0;
  const acceptedCount = data?.acceptedReqs?.length || 0;
  const declinedCount = data?.declinedReqs?.length || 0;

  const hasPending = pendingCount + acceptedCount + declinedCount > 0;
  return { hasPending, pendingCount, acceptedCount, declinedCount };
};

export default usePendingNotifications;
