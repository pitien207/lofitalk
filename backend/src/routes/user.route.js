import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  deleteFriendRequest,
  getOnlineUsersCount,
  getFriendFilterStatus,
  getFriendRequests,
  getFortuneCookie,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserProfile,
  openFortuneCookie,
  removeFriend,
  sendFriendRequest,
  getCurrentUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
} from "../controllers/user.controller.js";
import {
  deleteAdminNotificationForUser,
  listAdminNotificationsForUser,
} from "../controllers/adminNotification.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friend-filter-status", getFriendFilterStatus);
router.get("/online-count", getOnlineUsersCount);
router.get("/friends", getMyFriends);
router.get("/blocked", getBlockedUsers);
router.get("/me", getCurrentUser);
router.get("/profile/:id", getUserProfile);
router.get("/fortune-cookie", getFortuneCookie);
router.post("/fortune-cookie", openFortuneCookie);
router.delete("/friends/:id", removeFriend);
router.post("/block/:id", blockUser);
router.delete("/block/:id", unblockUser);
router.post("/report/:id", reportUser);
router.delete("/friend-request/:id/cancel", cancelFriendRequest);
router.delete("/friend-request/:id", deleteFriendRequest);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.put("/friend-request/:id/decline", declineFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);
router.get("/notifications", listAdminNotificationsForUser);
router.delete("/notifications/:id", deleteAdminNotificationForUser);

export default router;
