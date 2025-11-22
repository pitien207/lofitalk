import api from "./api";

export const fetchChatThreads = async () => {
  const { data } = await api.get("/chat/threads");
  return data?.threads ?? data ?? [];
};

export const fetchThreadWithUser = async (userId, limit = 50) => {
  if (!userId) {
    throw new Error("User id is required to open a conversation");
  }

  const { data } = await api.get(`/chat/threads/user/${userId}`, {
    params: { limit },
  });

  return data;
};

export const sendChatMessage = async (payload) => {
  const { data } = await api.post("/chat/messages", payload);
  return data;
};

export const markThreadRead = async (threadId) => {
  if (!threadId) return null;
  const { data } = await api.post(`/chat/threads/${threadId}/read`);
  return data;
};

export const fetchUnreadCount = async () => {
  const { data } = await api.get("/chat/unread-count");
  return data?.count ?? 0;
};
