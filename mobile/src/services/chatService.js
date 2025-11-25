import api from "./api";

const toFieldParam = (fields) =>
  Array.isArray(fields) ? fields.join(",") : fields;

export const fetchChatThreads = async (options = {}) => {
  const { limit = 20, cursor, updatedAfter, fields } =
    typeof options === "number" ? { limit: options } : options;

  const params = {
    limit,
    cursor,
    updatedAfter,
    fields: toFieldParam(fields),
  };

  const { data } = await api.get("/chat/threads", { params });

  return {
    threads: data?.threads ?? data ?? [],
    nextCursor: data?.nextCursor ?? null,
    hasMore: data?.hasMore ?? false,
  };
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
