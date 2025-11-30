import api from "./api";

const toFieldParam = (fields) =>
  Array.isArray(fields) ? fields.join(",") : fields;

export const fetchFriends = async (options = {}) => {
  const {
    limit = 25,
    cursor,
    updatedAfter,
    fields = [
      "_id",
      "fullName",
      "profilePic",
      "country",
      "city",
      "location",
      "isOnline",
      "lastActiveAt",
      "updatedAt",
    ],
  } = typeof options === "number" ? { limit: options } : options;

  const params = {
    limit,
    cursor,
    updatedAfter,
    fields: toFieldParam(fields),
  };

  const { data } = await api.get("/users/friends", { params });
  const friends = data?.friends ?? data ?? [];

  return {
    friends,
    nextCursor: data?.nextCursor ?? null,
    hasMore: data?.hasMore ?? false,
    total: data?.total ?? friends.length,
  };
};

export const fetchRecommendedUsers = async (params = {}) => {
  const normalizedParams = {
    ...params,
    limit: params.limit,
    cursor: params.cursor,
    fields: toFieldParam(
      params.fields || [
        "_id",
        "fullName",
        "profilePic",
        "country",
        "city",
        "location",
        "isOnline",
        "pendingRequestReceived",
        "pendingRequestSent",
      ]
    ),
  };
  const { data } = await api.get("/users", { params: normalizedParams });
  return data?.users ?? data;
};

export const fetchFriendProfile = async (friendId) => {
  if (!friendId) {
    throw new Error("friendId is required to fetch a profile");
  }

  const { data } = await api.get(`/users/profile/${friendId}`);
  return data?.user ?? data;
};

export const sendFriendRequest = async (friendId) => {
  if (!friendId) {
    throw new Error("friendId is required to send a request");
  }

  const { data } = await api.post(`/users/friend-request/${friendId}`);
  return data;
};

export const cancelFriendRequest = async (friendId) => {
  if (!friendId) {
    throw new Error("friendId is required to cancel a request");
  }

  const { data } = await api.delete(
    `/users/friend-request/${friendId}/cancel`
  );
  return data;
};

export const fetchOutgoingFriendRequests = async () => {
  const { data } = await api.get("/users/outgoing-friend-requests");
  return data;
};

export const fetchBlockedUsers = async () => {
  const { data } = await api.get("/users/blocked");
  return data;
};

export const blockUser = async (userId) => {
  if (!userId) {
    throw new Error("userId is required to block");
  }
  const { data } = await api.post(`/users/block/${userId}`);
  return data;
};

export const unblockUser = async (userId) => {
  if (!userId) {
    throw new Error("userId is required to unblock");
  }
  const { data } = await api.delete(`/users/block/${userId}`);
  return data;
};
