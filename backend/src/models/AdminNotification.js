import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    targetType: {
      type: String,
      enum: ["all", "single"],
      default: "all",
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    expireAt: {
      type: Date,
      required: true,
    },
    dismissedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: false }
);

adminNotificationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
adminNotificationSchema.path("dismissedBy").default(() => []);

export const AdminNotification =
  mongoose.models.AdminNotification ||
  mongoose.model("AdminNotification", adminNotificationSchema);
