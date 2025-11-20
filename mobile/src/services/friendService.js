import api from "./api";

export const fetchFriends = async () => {
  const { data } = await api.get("/users/friends");
  return data?.friends ?? data;
};

export const fetchRecommendedUsers = async (params = {}) => {
  const { data } = await api.get("/users", { params });
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
