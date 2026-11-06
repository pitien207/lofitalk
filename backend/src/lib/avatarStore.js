import mongoose from "mongoose";
import Avatar from "../models/Avatar.js";
import { buildAssetUrl, withAvatarVersion } from "../utils/assetUrl.js";

export const AVATAR_ROUTE_PREFIX = "/api/avatars";

// Public, cache-busting URL for an uploaded avatar: /api/avatars/<id>?v=<updatedAt ms>
export const buildUploadedAvatarUrl = (avatarDoc) =>
  withAvatarVersion(
    buildAssetUrl(`${AVATAR_ROUTE_PREFIX}/${avatarDoc._id}`),
    avatarDoc.updatedAt.getTime()
  );

// True when the URL points at the uploaded-avatar endpoint (any host).
export const isUploadedAvatarUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  try {
    return new URL(value, "http://placeholder").pathname.startsWith(
      `${AVATAR_ROUTE_PREFIX}/`
    );
  } catch (_error) {
    return false;
  }
};

// Replaces the user's uploaded avatar (or creates it). Returns the stored document.
export const saveAvatarForUser = async (userId, image) =>
  Avatar.findOneAndUpdate(
    { userId },
    {
      $set: {
        data: image.data,
        contentType: image.contentType,
        size: image.data.length,
        width: image.width,
        height: image.height,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, projection: { data: 0 } }
  );

export const deleteAvatarForUser = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) return 0;
  const result = await Avatar.deleteOne({ userId });
  return result.deletedCount || 0;
};

export const deleteAvatarsForUsers = async (userIds = []) => {
  const ids = userIds.filter((id) => mongoose.isValidObjectId(id));
  if (!ids.length) return 0;
  const result = await Avatar.deleteMany({ userId: { $in: ids } });
  return result.deletedCount || 0;
};
