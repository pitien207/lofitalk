import { Announcement } from "../models/Announcement.js";
import User from "../models/User.js";

const DEFAULT_EXPIRE_DAYS = 7;
const MAX_MESSAGE_LENGTH = 500;

const formatAnnouncement = (doc) => {
  if (!doc) return null;
  const creator = doc.createdBy;
  return {
    id: doc._id?.toString(),
    message: doc.message,
    createdAt: doc.createdAt,
    expireAt: doc.expireAt,
    createdBy: creator
      ? {
          id: creator._id?.toString?.() || creator.toString?.() || creator,
          fullName: creator.fullName || "",
        }
      : null,
  };
};

export const createAnnouncement = async (req, res) => {
  try {
    const rawMessage = req.body?.message;
    const message = rawMessage?.toString().trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
    }

    const expireInDays =
      Number.isFinite(Number(req.body?.expireInDays)) && Number(req.body.expireInDays) > 0
        ? Number(req.body.expireInDays)
        : DEFAULT_EXPIRE_DAYS;

    const expireAt = new Date(Date.now() + expireInDays * 24 * 60 * 60 * 1000);

    const announcement = await Announcement.create({
      message,
      createdBy: req.user._id,
      createdAt: new Date(),
      expireAt,
    });

    const creator = await User.findById(req.user._id).select("fullName");

    res.status(201).json({
      announcement: formatAnnouncement({ ...announcement.toObject(), createdBy: creator }),
    });
  } catch (error) {
    console.error("Error creating announcement", error.message);
    res.status(500).json({ message: "Failed to create announcement" });
  }
};

export const listAnnouncements = async (_req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      expireAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName");

    res.status(200).json({
      announcements: announcements.map((item) => formatAnnouncement(item)),
    });
  } catch (error) {
    console.error("Error fetching announcements", error.message);
    res.status(500).json({ message: "Failed to load announcements" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Announcement id is required" });
    }
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement", error.message);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
};
