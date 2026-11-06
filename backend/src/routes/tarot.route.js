import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { tarotReadingLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import * as S from "../validation/schemas.js";
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
// Safety net against API cost abuse; the energy rules are separate.
router.post(
  "/reading",
  tarotReadingLimiter,
  validate({ body: S.tarotReadingBody }),
  getTarotReading
);

export default router;
