import { ipKeyGenerator, rateLimit } from "express-rate-limit";

// In-memory counters (single replica). Behind the Azure Container Apps ingress the client IP
// comes from X-Forwarded-For, see app.set("trust proxy") in server.js.
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const ipKey = (req) => ipKeyGenerator(req.ip || "");
const emailKey = (req) =>
  typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
const userKey = (req) => req.user?._id?.toString() || ipKey(req);

const limiter = ({ windowMs, limit, keyGenerator, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator,
    skipSuccessfulRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ code: "RATE_LIMITED", message }),
  });

// Login: failed attempts only. 10 per account+IP, 50 per IP (shared networks), per 15 minutes.
export const loginAccountLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKey(req)}|${emailKey(req)}`,
  message: "Too many failed login attempts. Please wait 15 minutes and try again.",
});
export const loginIpLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 50,
  skipSuccessfulRequests: true,
  keyGenerator: ipKey,
  message: "Too many failed login attempts from your network. Please try again later.",
});

// Signup sends an email each time: 10 per hour per IP, 5 per hour per address.
export const signupIpLimiter = limiter({
  windowMs: HOUR,
  limit: 10,
  keyGenerator: ipKey,
  message: "Too many sign-up attempts. Please try again later.",
});
export const signupEmailLimiter = limiter({
  windowMs: HOUR,
  limit: 5,
  keyGenerator: (req) => `signup|${emailKey(req)}`,
  message: "Too many verification emails for this address. Please try again in an hour.",
});

// Signup code entry (each pending signup also locks after 5 wrong codes).
export const verifyCodeLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 30,
  keyGenerator: ipKey,
  message: "Too many attempts. Please wait 15 minutes and try again.",
});

// Password reset emails: 10 per hour per IP, 5 per hour per address.
export const forgotPasswordIpLimiter = limiter({
  windowMs: HOUR,
  limit: 10,
  keyGenerator: ipKey,
  message: "Too many password reset requests. Please try again later.",
});
export const forgotPasswordEmailLimiter = limiter({
  windowMs: HOUR,
  limit: 5,
  keyGenerator: (req) => `forgot|${emailKey(req)}`,
  message: "Too many reset emails for this address. Please try again in an hour.",
});

// Reset code entry (each code is also voided after 5 wrong attempts).
export const resetPasswordLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 20,
  keyGenerator: ipKey,
  message: "Too many attempts. Please wait 15 minutes and try again.",
});

// Logged-in actions, per account.
export const reportLimiter = limiter({
  windowMs: HOUR,
  limit: 10,
  keyGenerator: userKey,
  message: "Too many reports. Please try again later.",
});
// Account deletion checks the password: limit guesses from a hijacked session.
export const accountDeletionLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 5,
  keyGenerator: userKey,
  message: "Too many attempts. Please wait 15 minutes and try again.",
});
export const pushSubscribeLimiter = limiter({
  windowMs: HOUR,
  limit: 20,
  keyGenerator: userKey,
  message: "Too many requests. Please try again later.",
});
export const tarotReadingLimiter = limiter({
  windowMs: HOUR,
  limit: 20,
  keyGenerator: userKey,
  message: "Too many tarot readings. Please try again later.",
});
