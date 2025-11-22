import { useState } from "react";
import {
  fetchFriends,
  fetchFriendProfile,
  fetchRecommendedUsers,
  sendFriendRequest,
  cancelFriendRequest,
  fetchOutgoingFriendRequests,
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
  const [hasSentRequest, setHasSentRequest] = useState(new Set());

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
    setHasSentRequest(new Set());
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

  const syncOutgoingRequests = async () => {
    try {
      const outgoing = await fetchOutgoingFriendRequests();
      const next = new Set(
        (outgoing || []).map((req) => req?.recipient?._id).filter(Boolean)
      );
      setHasSentRequest(next);
    } catch (_err) {
      // non-blocking
    }
  };

  const applyFilters = async () => {
    setRecommendedLoading(true);
    setRecommendedError(null);
    try {
      await syncOutgoingRequests().catch(() => null);
      const params = buildFilterParams(filters);
      const users = await fetchRecommendedUsers(params);
      const normalized =
        users
          ?.map((user, index) =>
            user
              ? {
                  ...user,
                  _id: user._id || `${index}`,
                }
              : null
          )
          ?.filter(Boolean) || [];

      setRecommended(normalized);
      const flagged = new Set(
        (normalized || [])
          .filter((user) => user?.pendingRequestSent)
          .map((user) => user._id)
      );
      setHasSentRequest((prev) => {
        const merged = new Set(prev);
        flagged.forEach((id) => merged.add(id));
        return merged;
      });
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
    if (!userId) return false;
    setRequestingId(userId);
    try {
      await sendFriendRequest(userId);
      setHasSentRequest((prev) => new Set(prev).add(userId));
      return true;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to send friend request.";
      setRecommendedError(message);
      return false;
    } finally {
      await syncOutgoingRequests().catch(() => null);
      setRequestingId(null);
    }
  };

  const cancelRequest = async (userId) => {
    if (!userId) return false;
    setRequestingId(userId);
    try {
      await cancelFriendRequest(userId);
      setHasSentRequest((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      return true;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to cancel friend request.";
      setRecommendedError(message);
      if (error?.response?.status === 404) {
        setHasSentRequest((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
      return false;
    } finally {
      await syncOutgoingRequests().catch(() => null);
      setRequestingId(null);
    }
  };

  const hasPendingRequest = (userId) => hasSentRequest.has(userId);

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
    hasPendingRequest,
    loadFriends,
    setInitialFriends,
    selectFriend,
    resetSelection,
    resetAllFriends,
    updateFilter,
    resetFilters,
    applyFilters,
    sendRequest,
    cancelRequest,
  };
};

export default useFriends;
