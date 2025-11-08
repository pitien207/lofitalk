import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getTarotReading } from "../controllers/tarot.controller.js";

const router = express.Router();

router.post("/reading", protectRoute, getTarotReading);

export default router;

