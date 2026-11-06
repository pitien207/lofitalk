import express from "express";
import { listAvatarPaths } from "../utils/avatarPool.js";
import { buildAssetUrl } from "../utils/assetUrl.js";

const router = express.Router();

router.get("/version", (req, res) => {
  const mobileVersion = process.env.MOBILE_APP_VERSION || null;
  res.status(200).json({ mobileAppVersion: mobileVersion });
});

// Preset avatars as absolute URLs (the folder on disk is the single source of truth).
router.get("/avatars", (req, res) => {
  const { boy, girl } = listAvatarPaths("web");
  res.set("Cache-Control", "public, max-age=3600");
  res.status(200).json({
    boy: boy.map((p) => buildAssetUrl(p)),
    girl: girl.map((p) => buildAssetUrl(p)),
  });
});

export default router;
