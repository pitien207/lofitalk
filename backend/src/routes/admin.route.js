import express from "express";
import {
  getAllUsers,
  updateUserAccountType,
  listUserReports,
  resolveUserReport,
  deleteUserReport,
  getPendingReportCount,
  getUsageStatsSummary,
  banUser,
  unbanUser,
} from "../controllers/admin.controller.js";
import { sendAdminNotification } from "../controllers/adminNotification.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";
import { requireObjectIdParam, validate } from "../middleware/validate.middleware.js";
import * as S from "../validation/schemas.js";

const router = express.Router();

router.param("id", requireObjectIdParam);

router.use(protectRoute, requireAdmin);

router.get("/users", getAllUsers);
router.put(
  "/users/:id/account-type",
  validate({ body: S.accountTypeBody }),
  updateUserAccountType
);
router.put("/users/:id/ban", validate({ body: S.banBody }), banUser);
router.delete("/users/:id/ban", unbanUser);
router.post(
  "/notifications",
  validate({ body: S.adminNotificationBody }),
  sendAdminNotification
);
router.get("/reports", listUserReports);
router.post("/reports/:id/resolve", resolveUserReport);
router.delete("/reports/:id", deleteUserReport);
router.get("/reports/pending-count", getPendingReportCount);
router.get("/usage-stats", getUsageStatsSummary);

export default router;
