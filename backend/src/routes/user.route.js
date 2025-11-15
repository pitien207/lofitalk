import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  declineFriendRequest,
  deleteFriendRequest,
  getFriendRequests,
  getFortuneCookie,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserProfile,
  openFortuneCookie,
  removeFriend,
  sendFriendRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.get("/profile/:id", getUserProfile);
router.get("/fortune-cookie", getFortuneCookie);
router.post("/fortune-cookie", openFortuneCookie);
router.delete("/friends/:id", removeFriend);
router.delete("/friend-request/:id", deleteFriendRequest);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.put("/friend-request/:id/decline", declineFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
