import api, { setAuthToken } from "./api";

export const loginRequest = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
};
