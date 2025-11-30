import express from "express";
import {
  getAllUsers,
  updateUserAccountType,
  listUserReports,
  resolveUserReport,
  deleteUserReport,
  getPendingReportCount,
} from "../controllers/admin.controller.js";
import { sendAdminNotification } from "../controllers/adminNotification.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute, requireAdmin);

router.get("/users", getAllUsers);
router.put("/users/:id/account-type", updateUserAccountType);
router.post("/notifications", sendAdminNotification);
router.get("/reports", listUserReports);
router.post("/reports/:id/resolve", resolveUserReport);
router.delete("/reports/:id", deleteUserReport);
router.get("/reports/pending-count", getPendingReportCount);

export default router;
