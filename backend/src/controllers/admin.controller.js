import User from "../models/User.js";
import UserReport from "../models/UserReport.js";
import { loadUsageStats } from "../services/usageStats.service.js";
import { PERMANENT_BAN_DATE } from "../lib/accountStatus.js";
import {
  disconnectUserSockets,
  notifyAdmins,
  NotifyTopic,
} from "../lib/chatSocket.js";
import { removeAllPushSubscriptions } from "../lib/pushService.js";

const ALLOWED_ACCOUNT_TYPES = ["standard", "plus", "admin"];
const MAX_BAN_DAYS = 3650;

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("fullName email accountType isOnboarded createdAt bannedUntil banReason")
      .sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users for admin:", error.message);
    res.status(500).json({ message: "Failed to load users" });
  }
};

export const updateUserAccountType = async (req, res) => {
  const { id } = req.params;
  const { accountType } = req.body || {};

  if (!ALLOWED_ACCOUNT_TYPES.includes(accountType)) {
    return res.status(400).json({ message: "Invalid account type" });
  }

  if (accountType === "admin" && req.user._id.toString() !== id) {
    return res
      .status(403)
      .json({ message: "Cannot promote other users to admin" });
  }

  if (req.user._id.toString() === id && accountType !== "admin") {
    return res
      .status(400)
      .json({ message: "Cannot downgrade your own admin account" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { accountType },
      { new: true }
    ).select("fullName email accountType isOnboarded");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating account type:", error.message);
    res.status(500).json({ message: "Failed to update account type" });
  }
};

export const listUserReports = async (_req, res) => {
  try {
    const reports = await UserReport.find()
      .populate("reporter", "fullName email")
      .populate("target", "fullName email")
      .sort({ status: 1, createdAt: -1 });

    res.status(200).json({
      reports: reports.map((report) => ({
        id: report._id?.toString(),
        reporter: report.reporter
          ? {
              id: report.reporter._id?.toString(),
              fullName: report.reporter.fullName,
              email: report.reporter.email,
            }
          : null,
        target: report.target
          ? {
              id: report.target._id?.toString(),
              fullName: report.target.fullName,
              email: report.target.email,
            }
          : null,
        message: report.message,
        status: report.status,
        createdAt: report.createdAt,
        resolvedAt: report.resolvedAt,
        resolvedBy: report.resolvedBy?.toString() || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching reports for admin:", error.message);
    res.status(500).json({ message: "Failed to load reports" });
  }
};

export const getPendingReportCount = async (_req, res) => {
  try {
    const count = await UserReport.countDocuments({ status: "pending" });
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching pending report count:", error.message);
    res.status(500).json({ message: "Failed to load pending reports" });
  }
};

export const resolveUserReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Report id is required" });
    }

    const report = await UserReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status === "resolved") {
      return res.status(200).json({ success: true, report });
    }

    report.status = "resolved";
    report.resolvedAt = new Date();
    report.resolvedBy = req.user._id;
    await report.save();
    notifyAdmins(NotifyTopic.REPORTS);

    res.status(200).json({
      success: true,
      report: {
        id: report._id?.toString(),
        status: report.status,
        resolvedAt: report.resolvedAt,
        resolvedBy: report.resolvedBy?.toString() || null,
      },
    });
  } catch (error) {
    console.error("Error resolving report:", error.message);
    res.status(500).json({ message: "Failed to resolve report" });
  }
};

export const deleteUserReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Report id is required" });
    }

    const report = await UserReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status !== "resolved") {
      return res.status(400).json({ message: "Only resolved reports can be deleted" });
    }

    await report.deleteOne();
    notifyAdmins(NotifyTopic.REPORTS);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error.message);
    res.status(500).json({ message: "Failed to delete report" });
  }
};

export const getUsageStatsSummary = async (_req, res) => {
  try {
    const stats = await loadUsageStats();
    res.status(200).json({ stats });
  } catch (error) {
    console.error("Error fetching usage stats:", error.message);
    res.status(500).json({ message: "Failed to load usage stats" });
  }
};

// PUT /api/admin/users/:id/ban  body: { days?: 1..3650, permanent?: boolean, reason?: string }
// Suspends an account: it cannot log in or use the API, and every session is ended now.
export const banUser = async (req, res) => {
  const { id } = req.params;
  const permanent = req.body?.permanent === true;
  const days = Number(req.body?.days);
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";

  if (!permanent && (!Number.isInteger(days) || days < 1 || days > MAX_BAN_DAYS)) {
    return res
      .status(400)
      .json({ message: `Choose a duration of 1-${MAX_BAN_DAYS} days or a permanent suspension.` });
  }
  if (req.user._id.toString() === id) {
    return res.status(400).json({ message: "You cannot suspend your own account." });
  }

  try {
    const target = await User.findById(id).select("accountType tokenVersion");
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.accountType === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be suspended." });
    }

    const bannedUntil = permanent
      ? PERMANENT_BAN_DATE
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const updated = await User.findByIdAndUpdate(
      id,
      {
        $set: { bannedUntil, banReason: reason, bannedBy: req.user._id, isOnline: false },
        $inc: { tokenVersion: 1 }, // ends every existing session
      },
      { new: true }
    ).select("fullName email accountType bannedUntil banReason");

    disconnectUserSockets(id);
    await removeAllPushSubscriptions(id); // no notifications while suspended

    return res.status(200).json({ success: true, user: updated });
  } catch (error) {
    console.error("Error suspending user:", error.message);
    return res.status(500).json({ message: "Failed to suspend user" });
  }
};

// DELETE /api/admin/users/:id/ban
export const unbanUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { bannedUntil: null, banReason: "", bannedBy: null } },
      { new: true }
    ).select("fullName email accountType bannedUntil banReason");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ success: true, user: updated });
  } catch (error) {
    console.error("Error lifting suspension:", error.message);
    return res.status(500).json({ message: "Failed to lift suspension" });
  }
};
