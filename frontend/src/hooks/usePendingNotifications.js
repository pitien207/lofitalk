import { useQuery } from "@tanstack/react-query";
import { getAdminNotifications, getFriendRequests } from "../lib/api";
import { useRealtimeStore } from "../store/useRealtimeStore";
import { FALLBACK_REFETCH_MS } from "../constants/realtime";

const usePendingNotifications = () => {
  // Updates arrive as socket events (RealtimeNotificationsBridge); the slow
  // refetch is only a safety net. No polling at all while the user is idle.
  const paused = useRealtimeStore((state) => state.paused);

  const { data } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    staleTime: 30 * 1000,
    refetchInterval: paused ? false : FALLBACK_REFETCH_MS,
  });

  const { data: adminNotifications } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: getAdminNotifications,
    staleTime: 30 * 1000,
    refetchInterval: paused ? false : FALLBACK_REFETCH_MS,
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
