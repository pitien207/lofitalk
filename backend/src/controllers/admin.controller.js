import User from "../models/User.js";

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
