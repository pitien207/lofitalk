import express from "express";
import multer from "multer";
import { rateLimit } from "express-rate-limit";

import { protectRoute } from "../middleware/auth.middleware.js";
import { getAvatar, uploadAvatar } from "../controllers/avatar.controller.js";

export const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const router = express.Router();

// Per-user limit (keyed by account, not IP, so it works behind the Azure ingress proxy).
const avatarUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(),
  validate: { xForwardedForHeader: false },
  handler: (req, res) =>
    res.status(429).json({
      code: "RATE_LIMITED",
      message: "Too many uploads. Please wait a few minutes and try again.",
    }),
});

// Keeps the upload in memory (max 5 MB, single file); nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_UPLOAD_BYTES, files: 1, fields: 0, parts: 2 },
});

const receiveAvatarFile = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ code: "FILE_TOO_LARGE", message: "The image must be 5 MB or smaller." });
    }
    return res
      .status(400)
      .json({ code: "BAD_UPLOAD", message: "Send exactly one image in the \"avatar\" field." });
  });
};

router.get("/:id", getAvatar);
router.post("/", protectRoute, avatarUploadLimiter, receiveAvatarFile, uploadAvatar);

export default router;
