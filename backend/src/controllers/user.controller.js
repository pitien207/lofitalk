import mongoose from "mongoose";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import UserReport from "../models/UserReport.js";
import { hasBlockedUser } from "../lib/blockService.js";

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(value);

const normalizeFilterArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeUserList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const extractNumericHeight = (heightString = '') => {
  if (!heightString) return null;
  const match = heightString.toString().match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

const ONLINE_THRESHOLD_MINUTES = parseInt(process.env.USER_ONLINE_MINUTES || '5', 10);
const ONLINE_THRESHOLD_MS = ONLINE_THRESHOLD_MINUTES * 60 * 1000;

const getLastActiveDate = (userLike) => {
  if (!userLike?.lastActiveAt) return null;
  const date = new Date(userLike.lastActiveAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isUserCurrentlyOnline = (userLike) => {
  if (!userLike?.isOnline) return false;
  const lastActive = getLastActiveDate(userLike);
  if (!lastActive) return false;
  return Date.now() - lastActive.getTime() <= ONLINE_THRESHOLD_MS;
};

const toPlainObject = (value) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  return { ...value };
};

const withPresence = (userLike) => {
  if (!userLike) return null;
  const base = toPlainObject(userLike);
  base.isOnline = isUserCurrentlyOnline(userLike);
  return base;
};

const isSameUTCDay = (left, right) => {
  if (!left || !right) return false;
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
};

const MAX_RECOMMENDATIONS = 3;
const REPORT_WORD_LIMIT = 120;

const resetFortuneCookieForUser = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: {
      "fortuneCookie.message": "",
      "fortuneCookie.messageIndex": null,
      "fortuneCookie.openedAt": null,
    },
  });

  return {
    message: "",
    messageIndex: null,
    openedAt: null,
  };
};

const ensureFreshFortuneState = async (userId, fortune = {}) => {
  if (!fortune?.openedAt) {
    return {
      message: fortune?.message || "",
      messageIndex: typeof fortune?.messageIndex === "number" ? fortune.messageIndex : null,
      openedAt: fortune?.openedAt || null,
    };
  }

  const openedAtDate = new Date(fortune.openedAt);
  const now = new Date();

  if (isSameUTCDay(openedAtDate, now)) {
    return {
      message: fortune.message || "",
      messageIndex: typeof fortune?.messageIndex === "number" ? fortune.messageIndex : null,
      openedAt: fortune.openedAt,
    };
  }

  return await resetFortuneCookieForUser(userId);
};

const buildFortuneResponse = (fortune = {}) => {
  const openedAt = fortune?.openedAt || null;
  return {
    message: fortune?.message || "",
    messageIndex: typeof fortune?.messageIndex === "number" ? fortune.messageIndex : null,
    openedAt,
    canOpen: !openedAt,
  };
};

const normalizeLimit = (value, fallback = 20) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
};

const normalizeCursor = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeFieldSet = (rawFields, allowed, defaults) => {
  const parsed =
    rawFields && Array.isArray(rawFields)
      ? rawFields
      : rawFields
      ? rawFields
          .toString()
          .split(',')
          .map((field) => field.trim())
          .filter(Boolean)
      : null;

  const selected = new Set();
  (parsed || defaults || []).forEach((field) => {
    if (allowed.includes(field)) {
      selected.add(field);
    }
  });

  // ensure identifiers and presence fields stay available
  selected.add("_id");
  selected.add("isOnline");
  selected.add("lastActiveAt");
  selected.add("updatedAt");

  return Array.from(selected);
};

const FRIEND_ALLOWED_FIELDS = [
  "_id",
  "fullName",
  "profilePic",
  "country",
  "city",
  "birthCountry",
  "birthCity",
  "birthLocation",
  "location",
  "isOnline",
  "lastActiveAt",
  "updatedAt",
  "avatarVersion",
  "accountType",
  "bio",
  "gender",
  "height",
  "education",
];

const FRIEND_DEFAULT_FIELDS = [
  "_id",
  "fullName",
  "profilePic",
  "country",
  "city",
  "birthCountry",
  "birthCity",
  "location",
  "isOnline",
  "lastActiveAt",
  "updatedAt",
  "accountType",
];

export async function getFriendFilterStatus(req, res) {
  try {
    const viewerId = req.user._id || req.user.id;
    const viewer = await User.findById(viewerId).select("_id");

    if (!viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    const todayKey = new Date().toISOString().slice(0, 10);

    return res.status(200).json({
      date: todayKey,
      used: 0,
      remaining: Infinity,
      total: Infinity,
    });
  } catch (error) {
    console.error("Error fetching friend filter status", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOnlineUsersCount(req, res) {
  try {
    const viewerId = req.user._id || req.user.id;
    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);

    const count = await User.countDocuments({
      _id: { $ne: viewerId },
      isOnline: true,
      lastActiveAt: { $gte: threshold },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching online users count", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getRecommendedUsers(req, res) {
  try {
    const viewerId = req.user._id || req.user.id;
    const viewer = await User.findById(viewerId).select(
      "friends energy blockedUsers"
    );

    if (!viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentEnergy = Math.max(0, viewer.energy ?? 0);

    const friendIds = (viewer.friends || []).map((friendId) => toObjectId(friendId));
    const blockedIds = (viewer.blockedUsers || []).map((userId) =>
      toObjectId(userId)
    );
    const excludedIds = [toObjectId(viewerId), ...friendIds, ...blockedIds];

    const {
      gender,
      country,
      city,
      birthCountry,
      birthCity,
      education,
      heightMin,
    } = req.query;
    const requestedHobby = req.query.hobbies || req.query.hobby;
    const requestedPet = req.query.pets || req.query.pet;

    const matchStage = {
      _id: { $nin: excludedIds },
      isOnboarded: true,
      blockedUsers: { $ne: toObjectId(viewerId) },
    };

    if (gender) matchStage.gender = gender;
    if (country) matchStage.country = country;
    if (city) matchStage.city = city;
    if (education) matchStage.education = education;
    if (birthCountry) matchStage.birthCountry = birthCountry;
    if (birthCity) matchStage.birthCity = birthCity;

    const candidates = await User.aggregate([
      { $match: matchStage },
      { $sample: { size: 50 } },
      {
        $project: {
          fullName: 1,
          profilePic: 1,
          avatarVersion: 1,
          gender: 1,
          country: 1,
          city: 1,
          birthCountry: 1,
          birthCity: 1,
          birthLocation: 1,
          height: 1,
          education: 1,
          hobbies: 1,
          pets: 1,
          location: 1,
          isOnline: 1,
          lastActiveAt: 1,
          accountType: 1,
          isOnboarded: 1,
        },
      },
    ]);

    const requestedHobbies = normalizeFilterArray(requestedHobby);
    const requestedPets = normalizeFilterArray(requestedPet);
    const minHeightValue = heightMin ? parseFloat(heightMin) : null;

    const filtered = candidates.filter((candidate) => {
      const candidateHeight = extractNumericHeight(candidate.height);
      const meetsHeight =
        !minHeightValue ||
        (candidateHeight !== null && candidateHeight >= minHeightValue);

      const userHobbies = normalizeUserList(candidate.hobbies);
      const hobbiesMatch =
        !requestedHobbies.length ||
        requestedHobbies.every((filterValue) =>
          userHobbies.some(
            (userValue) =>
              userValue.toLowerCase() === filterValue.toLowerCase()
          )
        );

      const userPets = normalizeUserList(candidate.pets);
      const petsMatch =
        !requestedPets.length ||
        requestedPets.every((filterValue) =>
          userPets.some(
            (userValue) =>
              userValue.toLowerCase() === filterValue.toLowerCase()
          )
        );

      return meetsHeight && hobbiesMatch && petsMatch;
    });

    const normalizedUsers = filtered.slice(0, MAX_RECOMMENDATIONS).map(withPresence);

    res.status(200).json({
      users: normalizedUsers,
      energy: currentEnergy,
      remaining: Infinity,
      used: 0,
      total: Infinity,
      usageDate: null,
    });
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const viewerId = req.user.id;
    const limit = normalizeLimit(req.query.limit, 25);
    const cursor = normalizeCursor(req.query.cursor);
    const updatedAfter = normalizeCursor(req.query.updatedAfter);
    const fields = normalizeFieldSet(
      req.query.fields,
      FRIEND_ALLOWED_FIELDS,
      FRIEND_DEFAULT_FIELDS
    ).join(" ");

    const viewer = await User.findById(viewerId).select("friends");

    if (!viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendIds = viewer.friends || [];
    if (!friendIds.length) {
      return res.status(200).json({
        friends: [],
        hasMore: false,
        nextCursor: null,
        total: 0,
      });
    }

    const match = { _id: { $in: friendIds } };

    if (cursor || updatedAfter) {
      match.updatedAt = {};
      if (cursor) {
        match.updatedAt.$lt = cursor;
      }
      if (updatedAfter) {
        match.updatedAt.$gt = updatedAfter;
      }
      if (Object.keys(match.updatedAt).length === 0) {
        delete match.updatedAt;
      }
    }

    const friends = await User.find(match)
      .select(fields)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = friends.length > limit;
    const trimmed = hasMore ? friends.slice(0, limit) : friends;
    const friendsWithPresence = trimmed.map((friend) => withPresence(friend));

    const lastItem = trimmed[trimmed.length - 1];
    const nextCursor = hasMore ? lastItem?.updatedAt || null : null;

    res.status(200).json({
      friends: friendsWithPresence,
      hasMore,
      nextCursor,
      total: friendIds.length,
    });
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFortuneCookie(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("fortuneCookie");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fortuneState = await ensureFreshFortuneState(userId, user.fortuneCookie);

    return res.status(200).json(buildFortuneResponse(fortuneState));
  } catch (error) {
    console.error("Error fetching fortune cookie", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function openFortuneCookie(req, res) {
  try {
    const userId = req.user.id;
    const normalizedMessage = req.body?.message?.toString().trim();
    const rawIndex = req.body?.messageIndex;
    const parsedIndex = Number(rawIndex);
    const hasValidIndex = Number.isInteger(parsedIndex) && parsedIndex >= 0;

    if (!normalizedMessage || !hasValidIndex) {
      return res.status(400).json({ message: "Invalid fortune payload" });
    }

    const user = await User.findById(userId).select("fortuneCookie");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fortuneState = await ensureFreshFortuneState(userId, user.fortuneCookie);

    if (fortuneState.openedAt) {
      return res
        .status(400)
        .json({ message: "Fortune cookie already opened today" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "fortuneCookie.message": normalizedMessage,
          "fortuneCookie.messageIndex": parsedIndex,
          "fortuneCookie.openedAt": new Date(),
        },
      },
      { new: true, projection: { fortuneCookie: 1 } }
    );

    return res.status(200).json(buildFortuneResponse(updatedUser.fortuneCookie));
  } catch (error) {
    console.error("Error opening fortune cookie", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "You can't send friend request to yourself" });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(myId).select("blockedUsers friends"),
      User.findById(recipientId).select("blockedUsers friends"),
    ]);

    if (!sender) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (hasBlockedUser(sender, recipientId)) {
      return res.status(403).json({
        message: "You have blocked this user",
      });
    }

    if (hasBlockedUser(recipient, myId)) {
      return res.status(403).json({
        message: "You cannot send a request to this user",
      });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "A friend request already exists between you and this user",
      });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function cancelFriendRequest(req, res) {
  try {
    const senderId = req.user.id;
    const { id: recipientId } = req.params;

    const pendingRequest = await FriendRequest.findOne({
      sender: senderId,
      recipient: recipientId,
      status: "pending",
    });

    if (!pendingRequest) {
      return res
        .status(404)
        .json({ message: "Pending friend request not found" });
    }

    await pendingRequest.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Friend request cancelled" });
  } catch (error) {
    console.error("Error cancelling friend request", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request" });
    }

    const [recipientUser, senderUser] = await Promise.all([
      User.findById(friendRequest.recipient).select("blockedUsers"),
      User.findById(friendRequest.sender).select("blockedUsers"),
    ]);

    if (
      hasBlockedUser(recipientUser, friendRequest.sender) ||
      hasBlockedUser(senderUser, friendRequest.recipient)
    ) {
      return res.status(403).json({
        message: "This request cannot be accepted because a block is active",
      });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic country city");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    const declinedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "declined",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs, declinedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic country city");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getUserProfile(req, res) {
  try {
    const { id } = req.params;
    const viewerId = req.user.id;

    const user = await User.findById(id)
      .select(
        "fullName profilePic bio gender birthDate country city birthCountry birthCity birthLocation height education hobbies pets friends location createdAt isOnline lastActiveAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSelf = viewerId.toString() === user._id.toString();
    const isFriend =
      !isSelf && user.friends?.some((friendId) => friendId.toString() === viewerId);

    const [pendingSent, pendingReceived] = await Promise.all([
      FriendRequest.findOne({ sender: viewerId, recipient: id, status: "pending" }),
      FriendRequest.findOne({ sender: id, recipient: viewerId, status: "pending" }),
    ]);

    const { friends, ...rest } = user;

    const normalizedOnlineStatus = isUserCurrentlyOnline(user);

    res.status(200).json({
      ...rest,
      isOnline: normalizedOnlineStatus,
      isSelf,
      isFriend,
      pendingRequestSent: Boolean(pendingSent),
      pendingRequestSentId: pendingSent?._id ?? null,
      pendingRequestReceived: Boolean(pendingReceived),
    });
  } catch (error) {
    console.error("Error in getUserProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const viewerId = req.user.id;
    const user = await User.findById(viewerId)
      .select(
        "fullName profilePic bio gender birthDate country city birthCountry birthCity birthLocation height education hobbies pets location isOnline lastActiveAt isOnboarded accountType email"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalized = withPresence(user);

    res.status(200).json(normalized);
  } catch (error) {
    console.error("Error in getCurrentUser controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const viewerId = req.user.id;
    const viewer = await User.findById(viewerId).select("blockedUsers");

    if (!viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    const fields = normalizeFieldSet(
      req.query.fields,
      FRIEND_ALLOWED_FIELDS,
      FRIEND_DEFAULT_FIELDS
    ).join(" ");

    const blockedIds = viewer.blockedUsers || [];
    if (!blockedIds.length) {
      return res.status(200).json({ blocked: [] });
    }

    const blockedUsers = await User.find({ _id: { $in: blockedIds } })
      .select(fields)
      .sort({ fullName: 1 });

    res.status(200).json({
      blocked: blockedUsers.map((user) => withPresence(user)),
    });
  } catch (error) {
    console.error("Error fetching blocked users", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function blockUser(req, res) {
  try {
    const viewerId = req.user.id;
    const { id: targetId } = req.params;

    if (viewerId === targetId) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    const [viewer, target] = await Promise.all([
      User.findById(viewerId).select("blockedUsers friends"),
      User.findById(targetId).select("_id friends"),
    ]);

    if (!viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (hasBlockedUser(viewer, targetId)) {
      return res
        .status(200)
        .json({ success: true, message: "User already blocked" });
    }

    await Promise.all([
      User.findByIdAndUpdate(viewerId, {
        $addToSet: { blockedUsers: targetId },
        $pull: { friends: targetId },
      }),
      User.findByIdAndUpdate(targetId, { $pull: { friends: viewerId } }),
      FriendRequest.deleteMany({
        $or: [
          { sender: viewerId, recipient: targetId },
          { sender: targetId, recipient: viewerId },
        ],
      }),
    ]);

    res.status(200).json({ success: true, message: "User blocked" });
  } catch (error) {
    console.error("Error blocking user", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function unblockUser(req, res) {
  try {
    const viewerId = req.user.id;
    const { id: targetId } = req.params;

    const viewer = await User.findById(viewerId).select("blockedUsers");
    if (!viewer) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!hasBlockedUser(viewer, targetId)) {
      return res
        .status(200)
        .json({ success: true, message: "User already unblocked" });
    }

    await User.findByIdAndUpdate(viewerId, {
      $pull: { blockedUsers: targetId },
    });

    res.status(200).json({ success: true, message: "User unblocked" });
  } catch (error) {
    console.error("Error unblocking user", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function reportUser(req, res) {
  try {
    const reporterId = req.user.id;
    const { id: targetId } = req.params;
    const rawMessage = req.body?.message;
    const message = rawMessage?.toString().trim();

    if (!targetId) {
      return res.status(400).json({ message: "Target user is required" });
    }

    if (reporterId === targetId) {
      return res.status(400).json({ message: "Cannot report yourself" });
    }

    if (!message) {
      return res.status(400).json({ message: "Report message is required" });
    }

    const wordCount = message.split(/\s+/).filter(Boolean).length;
    if (wordCount > REPORT_WORD_LIMIT) {
      return res.status(400).json({
        message: `Report is too long. Please keep it under ${REPORT_WORD_LIMIT} words`,
      });
    }

    const targetUser = await User.findById(targetId).select("_id");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await UserReport.create({
      reporter: reporterId,
      target: targetId,
      message,
    });

    res.status(201).json({ success: true, message: "Report submitted" });
  } catch (error) {
    console.error("Error reporting user", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function removeFriend(req, res) {
  try {
    const viewerId = req.user.id;
    const { id: targetId } = req.params;

    if (viewerId === targetId) {
      return res.status(400).json({ message: "Cannot remove yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(viewerId, { $pull: { friends: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { friends: viewerId } });

    await FriendRequest.deleteMany({
      $or: [
        { sender: viewerId, recipient: targetId },
        { sender: targetId, recipient: viewerId },
      ],
    });

    res.status(200).json({ success: true, message: "Friend removed" });
  } catch (error) {
    console.error("Error removing friend", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    const isRecipient = friendRequest.recipient.toString() === userId;
    const isSender = friendRequest.sender.toString() === userId;

    if (!isRecipient && !isSender) {
      return res
        .status(403)
        .json({ message: "You are not allowed to modify this request" });
    }

    const canClearAccepted = friendRequest.status === "accepted";
    const canClearDeclined =
      friendRequest.status === "declined" && isSender;

    if (!canClearAccepted && !canClearDeclined) {
      return res.status(403).json({
        message: "This notification cannot be cleared.",
      });
    }

    await friendRequest.deleteOne();
    res.status(200).json({ success: true, message: "Request removed" });
  } catch (error) {
    console.error("Error deleting friend request", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function declineFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only the recipient can decline this request" });
    }

    friendRequest.status = "declined";
    await friendRequest.save();

    res.status(200).json({ success: true, message: "Request declined" });
  } catch (error) {
    console.error("Error declining friend request", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

