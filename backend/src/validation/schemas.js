import { z } from "zod";
import mongoose from "mongoose";
import { MAX_MESSAGE_LENGTH } from "../lib/chatService.js";

// Request schemas for validate() (middleware/validate.middleware.js).
// Rules of thumb:
// - check type and size of every field a controller reads; business rules
//   (e.g. "already friends") stay in the controllers;
// - objects are loose (unknown keys pass through), so older clients keep working;
// - login accepts any password length (accounts created before the 8-char rule),
//   new passwords need 8+ characters.

// Readable messages (shown to users by the web app), e.g. "\"bio\" must be at most
// 1000 characters". Messages passed explicitly to a rule take precedence.
const describe = (iss) => {
  const field = iss.path?.length ? `"${iss.path.join(".")}"` : "Value";
  const unit = iss.origin === "array" ? "items" : "characters";
  switch (iss.code) {
    case "invalid_type":
      return iss.input === undefined || iss.input === null
        ? `${field} is required`
        : `${field} must be a ${iss.expected}`;
    case "too_small":
      if (iss.origin === "string" && Number(iss.minimum) === 1) return `${field} is required`;
      return iss.exact
        ? `${field} must have exactly ${iss.minimum} ${unit}`
        : `${field} must be at least ${iss.minimum} ${unit}`;
    case "too_big":
      return iss.exact
        ? `${field} must have exactly ${iss.maximum} ${unit}`
        : `${field} must be at most ${iss.maximum} ${unit}`;
    case "invalid_value":
      return `${field} must be one of: ${(iss.values || []).join(", ")}`;
    case "invalid_union":
    case "invalid_format":
      return `${field} has an invalid format`;
    default:
      return undefined; // zod default message
  }
};
z.config({ customError: describe });

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const text = (max) => z.string().max(max);
const optionalText = (max) => text(max).optional().nullable();
const requiredText = (max) => z.string().trim().min(1).max(max);

// Format is checked only for new accounts; existing addresses are matched as stored.
const newEmail = z.string().trim().min(3).max(254).email("Invalid email format");
const email = z.string().trim().min(1).max(254);
const anyPassword = z.string().min(1).max(1024);
const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`);
const verificationCode = z.union([z.string().trim().max(12), z.number().int().nonnegative()]);
const objectId = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), "Invalid id");
const integerLike = z.union([
  z.number().int(),
  z.string().regex(/^-?\d{1,6}$/, "Must be a whole number"),
]);
const dateLike = z
  .string()
  .max(40)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

// Query strings: a repeated parameter (?a=1&a=2) arrives as an array, reject that.
const queryText = (max = 100) => z.string().max(max).optional();

// ---- auth -----------------------------------------------------------------
export const signupBody = z.looseObject({
  email: newEmail,
  password: newPassword,
  fullName: requiredText(80),
});

export const verifyCodeBody = z.looseObject({
  email,
  code: verificationCode,
});

export const loginBody = z.looseObject({
  email,
  password: anyPassword,
});

export const forgotPasswordBody = z.looseObject({ email });

export const resetPasswordBody = z.looseObject({
  email,
  code: verificationCode,
  newPassword,
});

export const updatePasswordBody = z.looseObject({
  currentPassword: anyPassword,
  newPassword,
});

export const onboardingBody = z.looseObject({
  fullName: requiredText(80),
  bio: optionalText(1000),
  gender: requiredText(40),
  birthDate: dateLike,
  country: requiredText(80),
  city: requiredText(80),
  birthCountry: optionalText(80),
  birthCity: optionalText(80),
  height: optionalText(20),
  education: optionalText(80),
  hobbies: optionalText(500),
  pets: optionalText(300),
  favoritePerfume: optionalText(120),
  // Preset/uploaded avatar URL; data: URLs are ignored by the controller.
  profilePic: optionalText(300_000),
});

// ---- users ----------------------------------------------------------------
export const recommendedUsersQuery = z.looseObject({
  gender: queryText(),
  country: queryText(),
  city: queryText(),
  birthCountry: queryText(),
  birthCity: queryText(),
  education: queryText(),
  heightMin: queryText(20),
  hobby: queryText(),
  hobbies: queryText(),
  pet: queryText(),
  pets: queryText(),
});

export const listPageQuery = z.looseObject({
  limit: z.string().regex(/^\d{1,3}$/, "Must be a number").optional(),
  cursor: queryText(64),
  updatedAfter: queryText(40),
  fields: queryText(300),
});

export const fortuneCookieBody = z.looseObject({
  message: requiredText(500),
  messageIndex: integerLike,
});

export const reportBody = z.looseObject({
  message: requiredText(500),
});

export const deleteAccountBody = z.looseObject({
  password: anyPassword,
});

// ---- chat -----------------------------------------------------------------
export const messagesQuery = z.looseObject({
  limit: z.string().regex(/^\d{1,3}$/, "Must be a number").optional(),
  before: queryText(40),
  after: queryText(40),
});

export const sendMessageBody = z
  .looseObject({
    toUserId: objectId.optional().nullable(),
    threadId: objectId.optional().nullable(),
    text: requiredText(MAX_MESSAGE_LENGTH),
  })
  .refine((body) => body.toUserId || body.threadId, {
    message: "toUserId or threadId is required",
    path: ["toUserId"],
  });

// ---- tarot ----------------------------------------------------------------
const tarotCard = z.union([
  text(80),
  z.looseObject({ name: text(80), reversed: z.boolean().optional() }),
]);

export const tarotReadingBody = z.looseObject({
  currentSituation: requiredText(1000),
  questions: z.array(requiredText(300)).length(3),
  cards: z.array(tarotCard).length(3),
});

// ---- admin ----------------------------------------------------------------
export const accountTypeBody = z.looseObject({
  accountType: z.enum(["standard", "plus", "admin"]),
});

export const banBody = z.looseObject({
  permanent: z.boolean().optional(),
  days: integerLike.optional().nullable(),
  reason: optionalText(500),
});

export const adminNotificationBody = z.looseObject({
  message: requiredText(500),
  targetType: z.enum(["all", "single"]).optional(),
  email: z.string().max(254).optional().nullable(),
  expireInDays: integerLike.optional().nullable(),
});

// ---- web push -------------------------------------------------------------
// Browser push services only use https endpoints.
const pushEndpoint = z
  .string()
  .max(2048)
  .refine((value) => /^https:\/\/\S+$/.test(value), "Invalid push endpoint");

export const pushSubscriptionBody = z.looseObject({
  endpoint: pushEndpoint,
  keys: z.looseObject({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(64),
  }),
});

export const pushUnsubscribeBody = z.looseObject({
  endpoint: z.string().min(1).max(2048),
});
