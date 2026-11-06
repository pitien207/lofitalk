import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { pushSubscribeLimiter } from "../middleware/rateLimit.middleware.js";
import * as S from "../validation/schemas.js";
import {
  getVapidPublicKey,
  isPushEnabled,
  removePushSubscription,
  savePushSubscription,
} from "../lib/pushService.js";

const router = express.Router();

// Public: tells the web app whether push is available and which key to subscribe with.
router.get("/config", (req, res) => {
  res.status(200).json({ enabled: isPushEnabled(), publicKey: getVapidPublicKey() });
});

router.use(protectRoute);

router.post(
  "/subscriptions",
  pushSubscribeLimiter,
  validate({ body: S.pushSubscriptionBody }),
  async (req, res) => {
    if (!isPushEnabled()) {
      return res.status(503).json({ message: "Push notifications are not available." });
    }
    try {
      await savePushSubscription(
        req.user._id,
        req.body,
        req.headers["user-agent"]?.toString() || ""
      );
      return res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error saving push subscription:", error.message);
      return res.status(500).json({ message: "Unable to enable notifications" });
    }
  }
);

router.delete(
  "/subscriptions",
  validate({ body: S.pushUnsubscribeBody }),
  async (req, res) => {
    try {
      await removePushSubscription(req.user._id, req.body.endpoint);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing push subscription:", error.message);
      return res.status(500).json({ message: "Unable to disable notifications" });
    }
  }
);

export default router;
