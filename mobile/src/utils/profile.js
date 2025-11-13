import { FALLBACK_MESSAGES } from "../constants";
import { getRandomAvatar } from "./avatarPool";

export const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
};

export const computeAge = (value) => {
  if (!value) return "";
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return `${age}`;
};

export const formatLocation = (user) => {
  if (!user) return "";
  const { city, country, location } = user;
  const joined = [city, country].filter(Boolean).join(", ");
  return joined || location || "";
};

export const normalizeFriends = (rawFriends = []) => {
  if (!Array.isArray(rawFriends)) return [];

  return rawFriends
    .map((friend, index) => {
      if (!friend) return null;

      const base =
        typeof friend === "object"
          ? friend
          : {
              _id: friend,
            };

      const locationText = formatLocation(base);
      const vibe = base.vibe || "Always up for a chat";
      const favoriteSong = base.favoriteSong || "Share your favorite tune";
      const hobbies =
        base.hobbies && base.hobbies.length
          ? parseListField(base.hobbies)
          : parseListField("");

      const resolvedAvatar =
        base.profilePic ||
        getRandomAvatar(base.gender) ||
        getRandomAvatar();

      return {
        _id: base._id || `${index}`,
        fullName: base.fullName || `Friend ${index + 1}`,
        profilePic: resolvedAvatar,
        location: locationText,
        lastMessage:
          base.lastMessage ||
          FALLBACK_MESSAGES[index % FALLBACK_MESSAGES.length],
        isOnline:
          base.isOnline !== undefined ? base.isOnline : index % 2 === 0,
        vibe,
        favoriteSong,
        hobbies,
      };
    })
    .filter(Boolean);
};

export const ensureFriendsData = (rawFriends) => normalizeFriends(rawFriends);
