import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getChatThreads,
  getThreadWithUser,
  getThreadMessages,
  getUnreadCount,
  markThreadRead,
  sendMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/threads", getChatThreads);
router.get("/threads/user/:userId", getThreadWithUser);
router.get("/threads/:threadId/messages", getThreadMessages);
router.post("/threads/:threadId/read", markThreadRead);
router.get("/unread-count", getUnreadCount);
router.post("/messages", sendMessage);

export default router;
