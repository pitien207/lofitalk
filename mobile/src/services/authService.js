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

export const updatePasswordRequest = async ({
  currentPassword,
  newPassword,
}) => {
  const { data } = await api.put("/auth/password", {
    currentPassword,
    newPassword,
  });
  return data;
};

export const requestPasswordReset = async ({ email }) => {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
};

export const resetPasswordWithCode = async ({
  email,
  code,
  newPassword,
}) => {
  const { data } = await api.post("/auth/reset-password", {
    email,
    code,
    newPassword,
  });
  return data;
};

export const completeOnboardingRequest = async (payload) => {
  const { data } = await api.post("/auth/onboarding", payload);
  return data;
};
