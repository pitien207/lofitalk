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

export const requestPasswordReset = async (payload) => {
  const response = await axiosInstance.post("/auth/forgot-password", payload);
  return response.data;
};

export const resetPasswordWithCode = async (payload) => {
  const response = await axiosInstance.post("/auth/reset-password", payload);
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

export async function getRecommendedUsers(filters = {}) {
  const response = await axiosInstance.get("/users", { params: filters });
  return response.data;
}

export async function getFriendFilterStatus() {
  const response = await axiosInstance.get("/users/friend-filter-status");
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

export async function cancelFriendRequest(userId) {
  const response = await axiosInstance.delete(
    `/users/friend-request/${userId}/cancel`
  );
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function getFortuneCookie() {
  const response = await axiosInstance.get("/users/fortune-cookie");
  return response.data;
}

export async function openFortuneCookie(payload) {
  const response = await axiosInstance.post("/users/fortune-cookie", payload);
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(
    `/users/friend-request/${requestId}/accept`
  );
  return response.data;
}

export async function getChatThreads() {
  const response = await axiosInstance.get("/chat/threads");
  return response.data;
}

export async function getChatThreadWithUser(userId, limit = 50) {
  const response = await axiosInstance.get(`/chat/threads/user/${userId}`, {
    params: { limit },
  });
  return response.data;
}

export async function getChatMessages(threadId, limit = 50) {
  const response = await axiosInstance.get(`/chat/threads/${threadId}/messages`, {
    params: { limit },
  });
  return response.data;
}

export async function sendChatMessage(payload) {
  const response = await axiosInstance.post("/chat/messages", payload);
  return response.data;
}

export async function markChatThreadRead(threadId) {
  const response = await axiosInstance.post(`/chat/threads/${threadId}/read`);
  return response.data;
}

export async function getChatUnreadCount() {
  const response = await axiosInstance.get("/chat/unread-count");
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

export async function getUserProfile(userId) {
  const response = await axiosInstance.get(`/users/profile/${userId}`);
  return response.data;
}

export async function updatePassword(payload) {
  const response = await axiosInstance.put("/auth/password", payload);
  return response.data;
}

export async function removeFriend(userId) {
  const response = await axiosInstance.delete(`/users/friends/${userId}`);
  return response.data;
}

export async function deleteFriendRequest(requestId) {
  const response = await axiosInstance.delete(`/users/friend-request/${requestId}`);
  return response.data;
}

export async function declineFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/decline`);
  return response.data;
}

export async function getAdminUsers() {
  const response = await axiosInstance.get("/admin/users");
  return response.data;
}

export async function updateUserAccountType(userId, accountType) {
  const response = await axiosInstance.put(`/admin/users/${userId}/account-type`, {
    accountType,
  });
  return response.data;
}

export async function getOnlineUsersCount() {
  const response = await axiosInstance.get("/users/online-count");
  return response.data;
}
