import api from "./api";

export const fetchChatThreads = async () => {
  const { data } = await api.get("/chat/threads");
  return data?.threads ?? data ?? [];
};

export const fetchThreadWithUser = async (userId, options = {}) => {
  if (!userId) {
    throw new Error("User id is required to open a conversation");
  }

  const { limit = 20, before, after } =
    typeof options === "number" ? { limit: options } : options;

  const { data } = await api.get(`/chat/threads/user/${userId}`, {
    params: { limit, before, after },
  });

  return data;
};

export const fetchThreadMessages = async (threadId, options = {}) => {
  if (!threadId) {
    throw new Error("Thread id is required to fetch messages");
  }

  const { limit = 20, before, after } =
    typeof options === "number" ? { limit: options } : options;

  const { data } = await api.get(`/chat/threads/${threadId}/messages`, {
    params: { limit, before, after },
  });

  return data?.messages ?? [];
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
