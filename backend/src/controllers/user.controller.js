import mongoose from "mongoose";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

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

const isSameUTCDay = (left, right) => {
  if (!left || !right) return false;
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
};

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


export async function getRecommendedUsers(req, res) {
  try {
    const viewerId = req.user._id || req.user.id;
    const viewer = await User.findById(viewerId).select('friends energy');

    if (!viewer) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentEnergy = Math.max(0, viewer.energy ?? 0);
    // Temporarily disable energy gating/consumption for friend filters.

    const friendIds = (viewer.friends || []).map((friendId) => toObjectId(friendId));
    const excludedIds = [toObjectId(viewerId), ...friendIds];

    const { gender, country, city, education, heightMin } = req.query;
    const requestedHobby = req.query.hobbies || req.query.hobby;
    const requestedPet = req.query.pets || req.query.pet;

    const matchStage = {
      _id: { $nin: excludedIds },
      isOnboarded: true,
    };

    if (gender) matchStage.gender = gender;
    if (country) matchStage.country = country;
    if (city) matchStage.city = city;
    if (education) matchStage.education = education;

    const candidates = await User.aggregate([
      { $match: matchStage },
      { $sample: { size: 50 } },
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

    res.status(200).json({
      users: filtered.slice(0, 5),
      energy: currentEnergy,
    });
  } catch (error) {
    console.error('Error in getRecommendedUsers controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic country city");

    res.status(200).json(user.friends);
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

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
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
        "fullName profilePic bio gender birthDate country city height education hobbies pets friends location createdAt"
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

    res.status(200).json({
      ...rest,
      isSelf,
      isFriend,
      pendingRequestSent: Boolean(pendingSent),
      pendingRequestReceived: Boolean(pendingReceived),
    });
  } catch (error) {
    console.error("Error in getUserProfile controller", error.message);
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

