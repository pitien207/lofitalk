import User from "../models/User.js";
import UserReport from "../models/UserReport.js";

const ALLOWED_ACCOUNT_TYPES = ["standard", "plus", "admin"];

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("fullName email accountType isOnboarded createdAt")
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error.message);
    res.status(500).json({ message: "Failed to delete report" });
  }
};
