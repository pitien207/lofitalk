import { useState } from "react";
import {
  fetchFriends,
  fetchFriendProfile,
  fetchRecommendedUsers,
  sendFriendRequest,
} from "../services/friendService";
import { ensureFriendsData } from "../utils/profile";

const createEmptyFilters = () => ({
  gender: "",
  country: "",
  city: "",
  heightMin: "",
  education: "",
  hobby: "",
  pet: "",
});

const buildFilterParams = (filters) => {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      params[key] = value;
    }
  });
  return params;
};

const useFriends = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [filters, setFilters] = useState(createEmptyFilters());
  const [recommended, setRecommended] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [recommendedError, setRecommendedError] = useState(null);
  const [requestingId, setRequestingId] = useState(null);

  const setInitialFriends = (rawFriends) => {
    setFriends(ensureFriendsData(rawFriends));
  };

  const loadFriends = async () => {
    try {
      const serverFriends = await fetchFriends();
      const normalized = ensureFriendsData(serverFriends);
      setFriends(normalized);
      return normalized;
    } catch (error) {
      throw error;
    }
  };

  const resetSelection = () => {
    setSelectedFriend(null);
    setFriendProfile(null);
    setProfileError(null);
    setProfileLoading(false);
  };

  const selectFriend = async (friend) => {
    setSelectedFriend(friend);
    setFriendProfile(null);
    setProfileError(null);

    if (!friend?._id) {
      return;
    }

    setProfileLoading(true);
    try {
      const profile = await fetchFriendProfile(friend._id);
      setFriendProfile(profile);
    } catch (error) {
      setProfileError(
        error?.response?.data?.message || "Unable to load profile right now."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const resetAllFriends = () => {
    setFriends([]);
    resetSelection();
    setFilters(createEmptyFilters());
    setRecommended([]);
    setRecommendedError(null);
    setRecommendedLoading(false);
    setRequestingId(null);
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "country" ? { city: "" } : {}),
    }));
  };

  const resetFilters = () => {
    setFilters(createEmptyFilters());
    setRecommended([]);
    setRecommendedError(null);
  };

  const applyFilters = async () => {
    setRecommendedLoading(true);
    setRecommendedError(null);
    try {
      const params = buildFilterParams(filters);
      const users = await fetchRecommendedUsers(params);
      setRecommended(users || []);
      return users;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to load recommendations.";
      setRecommendedError(message);
      throw error;
    } finally {
      setRecommendedLoading(false);
    }
  };

  const sendRequest = async (userId) => {
    if (!userId) return;
    setRequestingId(userId);
    try {
      await sendFriendRequest(userId);
    } finally {
      setRequestingId(null);
    }
  };

  return {
    friends,
    selectedFriend,
    friendProfile,
    profileLoading,
    profileError,
    filters,
    recommended,
    recommendedLoading,
    recommendedError,
    requestingId,
    loadFriends,
    setInitialFriends,
    selectFriend,
    resetSelection,
    resetAllFriends,
    updateFilter,
    resetFilters,
    applyFilters,
    sendRequest,
  };
};

export default useFriends;
