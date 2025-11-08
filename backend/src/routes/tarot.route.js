import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  consumeTarotEnergy,
  getEnergyStatus,
  refillTarotEnergy,
  getLastTarotReading,
  clearLastTarotReading,
  getTarotReading,
} from "../controllers/tarot.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/energy", getEnergyStatus);
router.post("/consume", consumeTarotEnergy);
router.post("/refill", refillTarotEnergy);
router.get("/latest", getLastTarotReading);
router.delete("/latest", clearLastTarotReading);
router.post("/reading", getTarotReading);

export default router;
