import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const verifySignupCode = async (payload) => {
  const response = await axiosInstance.post("/auth/verify-code", payload);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(
    `/users/friend-request/${requestId}/accept`
  );
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export async function getTarotReading(payload) {
  const response = await axiosInstance.post("/tarot/reading", payload);
  return response.data;
}

export async function getTarotEnergy() {
  const response = await axiosInstance.get("/tarot/energy");
  return response.data;
}

export async function consumeTarotEnergy() {
  const response = await axiosInstance.post("/tarot/consume");
  return response.data;
}

export async function refillTarotEnergy() {
  const response = await axiosInstance.post("/tarot/refill");
  return response.data;
}

export async function getTarotLatest() {
  const response = await axiosInstance.get("/tarot/latest");
  return response.data;
}

export async function clearTarotLatest() {
  const response = await axiosInstance.delete("/tarot/latest");
  return response.data;
}
