import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import UserReport from "../models/UserReport.js";
import PendingSignup from "../models/PendingSignup.js";
import { AdminNotification } from "../models/AdminNotification.js";
import { getChatConversationModel } from "../models/ChatConversation.js";
import { getChatMessageModel } from "../models/ChatMessage.js";
import { disconnectUserSockets } from "../lib/chatSocket.js";
import { removeAllPushSubscriptions } from "../lib/pushService.js";

// DELETE /api/users/me  body: { password }
// Permanently deletes the signed-in user's account and personal data (right to erasure).
export async function deleteMyAccount(req, res) {
  const { password } = req.body || {};
  if (!password) {
    return res
      .status(400)
      .json({ message: "Please enter your password to delete your account." });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordOk = await user.matchPassword(String(password));
    if (!passwordOk) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    const userId = user._id;
    const Conversation = getChatConversationModel();
    const Message = getChatMessageModel();

    // Chats this user took part in (both sides' history of those chats is removed).
    const conversationIds = (
      await Conversation.find({ participants: userId }).select("_id").lean()
    ).map((conversation) => conversation._id);

    await Promise.all([
      Message.deleteMany({
        $or: [{ conversation: { $in: conversationIds } }, { sender: userId }, { recipient: userId }],
      }),
      Conversation.deleteMany({ _id: { $in: conversationIds } }),
      FriendRequest.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      UserReport.deleteMany({ $or: [{ reporter: userId }, { target: userId }] }),
      AdminNotification.deleteMany({ targetUser: userId }),
      removeAllPushSubscriptions(userId),
      AdminNotification.updateMany({ dismissedBy: userId }, { $pull: { dismissedBy: userId } }),
      User.updateMany(
        { $or: [{ friends: userId }, { blockedUsers: userId }] },
        { $pull: { friends: userId, blockedUsers: userId } }
      ),
      PendingSignup.deleteMany({ email: user.email }),
    ]);

    // Last: removing the user also removes the uploaded avatar (User model delete hook).
    await User.findByIdAndDelete(userId);

    disconnectUserSockets(userId);
    res.clearCookie("jwt");
    return res.status(200).json({ success: true, message: "Your account has been deleted." });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ message: "Could not delete the account. Please try again." });
  }
}
