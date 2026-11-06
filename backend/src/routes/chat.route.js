import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getChatThreads,
  getThreadWithUser,
  getThreadMessages,
  getUnreadCount,
  markThreadRead,
  sendMessage,
  clearThreadMessages,
} from "../controllers/chat.controller.js";
import { requireObjectIdParam, validate } from "../middleware/validate.middleware.js";
import * as S from "../validation/schemas.js";

const router = express.Router();

router.param("threadId", requireObjectIdParam);
router.param("userId", requireObjectIdParam);

router.use(protectRoute);

router.get("/threads", validate({ query: S.listPageQuery }), getChatThreads);
router.get(
  "/threads/user/:userId",
  validate({ query: S.messagesQuery }),
  getThreadWithUser
);
router.get(
  "/threads/:threadId/messages",
  validate({ query: S.messagesQuery }),
  getThreadMessages
);
router.post("/threads/:threadId/read", markThreadRead);
router.get("/unread-count", getUnreadCount);
router.post("/messages", validate({ body: S.sendMessageBody }), sendMessage);
router.delete("/threads/:threadId/messages", clearThreadMessages);

export default router;
