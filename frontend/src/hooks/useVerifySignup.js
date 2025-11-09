import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifySignupCode } from "../lib/api";

const useVerifySignup = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: verifySignupCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  return { verifySignupMutation: mutate, isVerifying: isPending, verifyError: error };
};

export default useVerifySignup;
