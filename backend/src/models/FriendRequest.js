import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Matches the queries in user.controller: incoming/outgoing lists by status, and the
// sender+recipient lookups for duplicates, profile state and cleanup.
friendRequestSchema.index({ recipient: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });
friendRequestSchema.index({ sender: 1, recipient: 1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
