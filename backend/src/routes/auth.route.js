import express from "express";
import {
  login,
  logout,
  signup,
  onboard,
  verifySignupCode,
  updatePassword,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireScalarFields, validate } from "../middleware/validate.middleware.js";
import * as S from "../validation/schemas.js";
import {
  forgotPasswordEmailLimiter,
  forgotPasswordIpLimiter,
  loginAccountLimiter,
  loginIpLimiter,
  resetPasswordLimiter,
  signupEmailLimiter,
  signupIpLimiter,
  verifyCodeLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post(
  "/signup",
  requireScalarFields("email", "password", "fullName"),
  signupIpLimiter,
  signupEmailLimiter,
  validate({ body: S.signupBody }),
  signup
);
router.post(
  "/verify-code",
  requireScalarFields("email", "code"),
  verifyCodeLimiter,
  validate({ body: S.verifyCodeBody }),
  verifySignupCode
);
router.post(
  "/login",
  requireScalarFields("email", "password"),
  loginIpLimiter,
  loginAccountLimiter,
  validate({ body: S.loginBody }),
  login
);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  requireScalarFields("email"),
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  validate({ body: S.forgotPasswordBody }),
  requestPasswordReset
);
router.post(
  "/reset-password",
  requireScalarFields("email", "code", "newPassword"),
  resetPasswordLimiter,
  validate({ body: S.resetPasswordBody }),
  resetPassword
);

router.post(
  "/onboarding",
  protectRoute,
  validate({ body: S.onboardingBody }),
  onboard
);
router.put(
  "/password",
  protectRoute,
  requireScalarFields("currentPassword", "newPassword"),
  validate({ body: S.updatePasswordBody }),
  updatePassword
);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
