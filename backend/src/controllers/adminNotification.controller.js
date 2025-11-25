import { AdminNotification } from "../models/AdminNotification.js";
import User from "../models/User.js";

const DEFAULT_EXPIRE_DAYS = 3;
const MAX_MESSAGE_LENGTH = 500;

export const sendAdminNotification = async (req, res) => {
  try {
    const rawMessage = req.body?.message;
    const targetType = req.body?.targetType === "single" ? "single" : "all";
    const rawEmail = req.body?.email;
    const expireInDays =
      Number.isFinite(Number(req.body?.expireInDays)) && Number(req.body?.expireInDays) > 0
        ? Number(req.body.expireInDays)
        : DEFAULT_EXPIRE_DAYS;

    const message = rawMessage?.toString().trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
    }

    let targetUserId = null;
    if (targetType === "single") {
      const email = rawEmail?.toString().trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ message: "Email is required for single user notifications" });
      }
      const user = await User.findOne({ email }).select("_id");
      if (!user) {
        return res.status(404).json({ message: "User with that email was not found" });
      }
      targetUserId = user._id;
    }

    const expireAt = new Date(Date.now() + expireInDays * 24 * 60 * 60 * 1000);

    const doc = await AdminNotification.create({
      message,
      targetType,
      targetUser: targetUserId,
      createdBy: req.user._id,
      createdAt: new Date(),
      expireAt,
    });

    res.status(201).json({
      notification: {
        id: doc._id?.toString(),
        message: doc.message,
        targetType: doc.targetType,
        targetUser: doc.targetUser,
        createdAt: doc.createdAt,
        expireAt: doc.expireAt,
      },
    });
  } catch (error) {
    console.error("Error sending admin notification", error.message);
    res.status(500).json({ message: "Failed to send notification" });
  }
};

export const listAdminNotificationsForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const notifications = await AdminNotification.find({
      expireAt: { $gt: now },
      $or: [{ targetType: "all" }, { targetType: "single", targetUser: userId }],
    })
      .sort({ createdAt: -1 })
      .select("_id message targetType targetUser createdAt expireAt");

    res.status(200).json({
      notifications: notifications.map((n) => ({
        id: n._id?.toString(),
        message: n.message,
        targetType: n.targetType,
        targetUser: n.targetUser,
        createdAt: n.createdAt,
        expireAt: n.expireAt,
      })),
    });
  } catch (error) {
    console.error("Error listing admin notifications", error.message);
    res.status(500).json({ message: "Failed to load admin notifications" });
  }
};

export const deleteAdminNotificationForUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Notification id is required" });
    }

    const notification = await AdminNotification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const isTargeted =
      notification.targetType === "single" &&
      notification.targetUser?.toString() === req.user._id.toString();

    const isForAll = notification.targetType === "all";

    if (!isTargeted && !isForAll) {
      return res.status(403).json({ message: "You cannot remove this notification" });
    }

    await notification.deleteOne();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting admin notification", error.message);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};
