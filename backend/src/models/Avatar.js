import mongoose from "mongoose";

// Uploaded profile pictures, kept out of the user document.
// One document per user (unique userId): a new upload overwrites the previous image,
// so replaced avatars never linger as orphans.
const avatarSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    data: { type: Buffer, required: true }, // processed 256x256 WebP, stored as BSON Binary
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
  },
  { timestamps: true, collection: "avatars" }
);

const Avatar = mongoose.models.Avatar || mongoose.model("Avatar", avatarSchema);

export default Avatar;
