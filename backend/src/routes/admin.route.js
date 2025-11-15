import express from "express";
import {
  getAllUsers,
  updateUserAccountType,
} from "../controllers/admin.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute, requireAdmin);

router.get("/users", getAllUsers);
router.put("/users/:id/account-type", updateUserAccountType);

export default router;
