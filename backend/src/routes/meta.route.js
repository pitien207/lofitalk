import express from "express";

const router = express.Router();

router.get("/version", (req, res) => {
  const mobileVersion = process.env.MOBILE_APP_VERSION || null;
  res.status(200).json({ mobileAppVersion: mobileVersion });
});

export default router;
