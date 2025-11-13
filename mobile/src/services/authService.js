import api, { setAuthToken } from "./api";

export const loginRequest = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
};

export const signupRequest = async ({ fullName, email, password }) => {
  const { data } = await api.post("/auth/signup", {
    fullName,
    email,
    password,
  });
  return data;
};

export const verifySignupCodeRequest = async ({ email, code }) => {
  const { data } = await api.post("/auth/verify-code", {
    email,
    code,
  });
  return data;
};
