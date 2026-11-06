import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import { disablePushOnLogout } from "../utils/pushNotifications";

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    // Remove this browser's push subscription first (needs the session cookie).
    mutationFn: async () => {
      await disablePushOnLogout();
      return logout();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;
