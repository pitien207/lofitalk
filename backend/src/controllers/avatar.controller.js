import mongoose from "mongoose";
import Avatar from "../models/Avatar.js";
import User from "../models/User.js";
import { AvatarImageError, processAvatarImage } from "../lib/avatarImage.js";
import { buildUploadedAvatarUrl, saveAvatarForUser } from "../lib/avatarStore.js";

// POST /api/avatars  (multipart field "avatar"; auth + rate limit + 5 MB limit run before this)
export async function uploadAvatar(req, res) {
  if (!req.file?.buffer?.length) {
    return res
      .status(400)
      .json({ code: "NO_FILE", message: "Please choose an image to upload." });
  }

  try {
    const image = await processAvatarImage(req.file.buffer);
    const avatar = await saveAvatarForUser(req.user._id, image);
    const profilePic = buildUploadedAvatarUrl(avatar);
    const avatarVersion = avatar.updatedAt.getTime();

    await User.updateOne({ _id: req.user._id }, { $set: { profilePic, avatarVersion } });

    return res.status(200).json({
      success: true,
      profilePic,
      avatarVersion,
      avatar: {
        id: avatar._id.toString(),
        contentType: avatar.contentType,
        size: avatar.size,
        width: avatar.width,
        height: avatar.height,
      },
    });
  } catch (error) {
    if (error instanceof AvatarImageError) {
      return res.status(error.status).json({ code: error.code, message: error.message });
    }
    console.error("Avatar upload failed:", error);
    return res
      .status(500)
      .json({ code: "UPLOAD_FAILED", message: "Could not save the image. Please try again." });
  }
}

// GET /api/avatars/:id?v=<version>  (public, like the preset avatars)
export async function getAvatar(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Avatar not found" });
  }

  try {
    const avatar = await Avatar.findById(id).select("data contentType updatedAt").lean();
    if (!avatar) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    const version = String(avatar.updatedAt.getTime());
    const isCurrentVersion = req.query.v === version;

    res.set({
      "Content-Type": avatar.contentType,
      ETag: `"${id}-${version}"`,
      "X-Content-Type-Options": "nosniff",
      // The versioned URL never changes content -> cache for a year; anything else revalidates.
      "Cache-Control": isCurrentVersion
        ? "public, max-age=31536000, immutable"
        : "public, no-cache",
    });

    if (req.fresh) {
      return res.status(304).end();
    }

    const body = Buffer.isBuffer(avatar.data) ? avatar.data : avatar.data.buffer;
    return res.status(200).send(body);
  } catch (error) {
    console.error("Avatar fetch failed:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
