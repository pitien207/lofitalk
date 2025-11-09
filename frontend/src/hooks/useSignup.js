import { useMutation } from "@tanstack/react-query";
import { signup } from "../lib/api";

const useSignUp = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: signup,
  });

  return { isPending, error, signupMutation: mutate };
};
export default useSignUp;
