import api from "./api";

export const fetchFriends = async () => {
  const { data } = await api.get("/users/friends");
  return data?.friends ?? data;
};

export const fetchFriendProfile = async (friendId) => {
  if (!friendId) {
    throw new Error("friendId is required to fetch a profile");
  }

  const { data } = await api.get(`/users/profile/${friendId}`);
  return data?.user ?? data;
};
