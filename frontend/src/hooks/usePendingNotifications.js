import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

const usePendingNotifications = () => {
  const { data } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    staleTime: 30 * 1000,
  });

  const pendingCount = data?.incomingReqs?.length || 0;
  return { hasPending: pendingCount > 0, pendingCount };
};

export default usePendingNotifications;
