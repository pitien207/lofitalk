import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { listAnnouncements } from "../controllers/announcement.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", listAnnouncements);

export default router;
