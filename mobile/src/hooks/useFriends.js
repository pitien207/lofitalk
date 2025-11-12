import { useState } from "react";
import { fetchFriends, fetchFriendProfile } from "../services/friendService";
import { ensureFriendsData } from "../utils/profile";

const useFriends = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

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
  };

  return {
    friends,
    selectedFriend,
    friendProfile,
    profileLoading,
    profileError,
    loadFriends,
    setInitialFriends,
    selectFriend,
    resetSelection,
    resetAllFriends,
  };
};

export default useFriends;
