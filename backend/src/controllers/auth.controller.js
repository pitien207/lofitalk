import User from "../models/User.js";
import PendingSignup from "../models/PendingSignup.js";
import bcrypt from "bcryptjs";
import { signAuthToken, verifyAuthToken } from "../lib/authToken.js";
import { disconnectUserSockets } from "../lib/chatSocket.js";
import { getActiveBan, suspendedResponse } from "../lib/accountStatus.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/email.js";
import { getRandomAvatar, resolveAvatarPath } from "../utils/avatarPool.js";
import { buildAssetUrl, withAvatarVersion } from "../utils/assetUrl.js";
import { deleteAvatarForUser, isUploadedAvatarUrl } from "../lib/avatarStore.js";

const CODE_EXPIRATION_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;
export const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_TOO_SHORT = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Emails are stored and compared lower-case and trimmed ("A@x.com" == "a@x.com").
export const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Finds a user by normalized email; falls back to a case-insensitive match for accounts
// created before emails were normalized.
const findUserByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const exact = await User.findOne({ email: normalized });
  if (exact) return exact;
  return User.findOne({ email: { $regex: `^${escapeRegex(normalized)}$`, $options: "i" } });
};

// Rewrites a legacy mixed-case email to lower case unless another account already uses it.
const normalizeStoredEmail = async (user) => {
  const normalized = normalizeEmail(user.email);
  if (!normalized || user.email === normalized) return;
  const clash = await User.exists({ email: normalized, _id: { $ne: user._id } });
  if (!clash) {
    await User.updateOne({ _id: user._id }, { $set: { email: normalized } });
    user.email = normalized;
  }
};

// The web app authenticates with the httpOnly cookie only; the mobile app (Bearer token)
// also needs the token in the response body.
const wantsTokenInBody = (req) =>
  req.headers["x-client-platform"]?.toString().toLowerCase() === "mobile";

const setAuthCookie = (res, token) => {
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
};

const PUBLIC_USER_FIELDS = [
  "_id",
  "fullName",
  "email",
  "bio",
  "gender",
  "birthDate",
  "country",
  "city",
  "birthCountry",
  "birthCity",
  "birthLocation",
  "height",
  "education",
  "hobbies",
  "pets",
  "favoritePerfume",
  "profilePic",
  "avatarVersion",
  "isEmailVerified",
  "isOnboarded",
  "isOnline",
  "lastActiveAt",
  "location",
  "accountType",
  "energy",
  "lastEnergyRefill",
];

const toPublicUser = (userDoc) => {
  if (!userDoc) return null;
  const raw =
    typeof userDoc.toJSON === "function" ? userDoc.toJSON() : { ...userDoc };
  const safe = {};

  PUBLIC_USER_FIELDS.forEach((field) => {
    if (raw[field] !== undefined) {
      safe[field] = raw[field];
    }
  });

  safe.id = raw._id?.toString?.() ?? raw._id;

  return safe;
};

export async function signup(req, res) {
  const { password, fullName } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: PASSWORD_TOO_SHORT });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.isEmailVerified
          ? "Email already exists, please use a different one"
          : "Please verify your email before logging in.",
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(
      Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000
    );

    const platformHeader = req.headers["x-client-platform"]?.toString().toLowerCase();
    const avatarSource = platformHeader === "web" ? "web" : "mobile";
    const randomAvatarPath = getRandomAvatar(undefined, avatarSource);
    const randomAvatar = randomAvatarPath
      ? withAvatarVersion(buildAssetUrl(randomAvatarPath))
      : "";

    const hashedPassword = await bcrypt.hash(password, 10);

    // The account is only created after the emailed code is confirmed (verifySignupCode).
    // Submitting the form again for the same email issues a new code (acts as "resend").
    await PendingSignup.findOneAndUpdate(
      { email },
      {
        fullName,
        passwordHash: hashedPassword,
        profilePic: randomAvatar,
        verificationCode,
        verificationCodeExpiresAt,
        verificationAttempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError?.message || mailError);
      return res.status(502).json({
        message:
          "Could not send the verification email. Please try again in a few minutes.",
      });
    }

    return res.status(201).json({
      success: true,
      verificationRequired: true,
      message: "Verification code sent to your email address.",
    });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await findUserByEmail(email);
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isEmailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    const isPasswordCorrect = await user.matchPassword(String(password));
    if (!isPasswordCorrect)
      return res.status(401).json({ message: "Invalid email or password" });

    // Only revealed after a correct password.
    const ban = getActiveBan(user);
    if (ban) {
      return res.status(403).json(suspendedResponse(ban));
    }

    await normalizeStoredEmail(user);

    user.isOnline = true;
    user.lastActiveAt = new Date();
    await user.save();

    const token = signAuthToken(user);

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      ...(wantsTokenInBody(req) ? { token } : {}),
      user: toPublicUser(user),
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function logout(req, res) {
  try {
    const token = req.cookies?.jwt;
    if (token) {
      try {
        const decoded = verifyAuthToken(token);
        if (decoded?.userId) {
          await User.findByIdAndUpdate(decoded.userId, {
            $set: {
              isOnline: false,
              lastActiveAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.log("Failed to update user presence on logout:", error.message);
      }
    }
  } finally {
    res.clearCookie("jwt");
    res.status(200).json({ success: true, message: "Logout successful" });
  }
}

export async function verifySignupCode(req, res) {
  const { code } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const normalizedCode = String(code).trim();

    let user = await findUserByEmail(email);
    let pendingSignup = null;

    if (!user) {
      pendingSignup = await PendingSignup.findOne({ email });
      if (!pendingSignup) {
        return res.status(404).json({ message: "Signup session not found" });
      }

      if (
        !pendingSignup.verificationCodeExpiresAt ||
        pendingSignup.verificationCodeExpiresAt < new Date()
      ) {
        return res.status(400).json({
          message: "Verification code expired. Please sign up again to get a new code.",
        });
      }

      if (
        !pendingSignup.verificationCode ||
        pendingSignup.verificationCode !== normalizedCode
      ) {
        // Limit guesses on the 6-digit code; afterwards a new signup (new code) is required.
        const attempts = (pendingSignup.verificationAttempts || 0) + 1;
        if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
          await PendingSignup.deleteOne({ _id: pendingSignup._id });
          return res.status(400).json({
            message: "Too many incorrect codes. Please sign up again to get a new code.",
          });
        }
        await PendingSignup.updateOne(
          { _id: pendingSignup._id },
          { $set: { verificationAttempts: attempts } }
        );
        return res
          .status(400)
          .json({ message: "Invalid or expired verification code" });
      }

      user = new User({
        email: pendingSignup.email,
        fullName: pendingSignup.fullName,
        password: pendingSignup.passwordHash,
        profilePic: withAvatarVersion(pendingSignup.profilePic),
        avatarVersion: Date.now(),
        isEmailVerified: true,
      });
      user._skipPasswordHash = true;
      await user.save();
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
    } else {
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      if (
        !user.verificationCode ||
        user.verificationCode !== normalizedCode ||
        !user.verificationCodeExpiresAt ||
        user.verificationCodeExpiresAt < new Date()
      ) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification code" });
      }

      user.isEmailVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
      await user.save();
    }

    const token = signAuthToken(user);

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      ...(wantsTokenInBody(req) ? { token } : {}),
      user: toPublicUser(user),
    });
  } catch (error) {
    console.log("Error verifying signup code:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required" });
    }

    if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: PASSWORD_TOO_SHORT });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(String(currentPassword));
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    // Log out every other session; this one gets a fresh token below.
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      ...(wantsTokenInBody(req) ? { token } : {}),
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("Error updating password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function requestPasswordReset(req, res) {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await findUserByEmail(email);

    // Do not reveal whether the email exists to avoid enumeration
    if (!user || !user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset code will be sent shortly.",
      });
    }

    const resetCode = generateVerificationCode();
    const resetExpiresAt = new Date(
      Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000
    );

    user.passwordResetCode = resetCode;
    user.passwordResetCodeExpiresAt = resetExpiresAt;
    user.passwordResetAttempts = 0;
    await user.save();

    await sendPasswordResetEmail(email, resetCode);

    res.status(200).json({
      success: true,
      message: "If this email is registered, a reset code will be sent shortly.",
    });
  } catch (error) {
    console.log("Error in requestPasswordReset controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resetPassword(req, res) {
  const { code, newPassword } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email, verification code, and new password are required" });
  }

  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: PASSWORD_TOO_SHORT });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    const normalizedCode = String(code).trim();
    if (
      !user.passwordResetCode ||
      !user.passwordResetCodeExpiresAt ||
      user.passwordResetCodeExpiresAt < new Date()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    if (user.passwordResetCode !== normalizedCode) {
      // Limit guesses on the 6-digit code; afterwards a new code must be requested.
      const attempts = (user.passwordResetAttempts || 0) + 1;
      if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
        user.passwordResetCode = undefined;
        user.passwordResetCodeExpiresAt = undefined;
        user.passwordResetAttempts = 0;
        await user.save();
        return res.status(400).json({
          message: "Too many incorrect codes. Please request a new reset code.",
        });
      }
      user.passwordResetAttempts = attempts;
      await user.save();
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpiresAt = undefined;
    user.passwordResetAttempts = 0;
    // Log out every existing session (web, mobile, open sockets).
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    disconnectUserSockets(user._id);

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log("Error in resetPassword controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const isAdmin = req.user?.accountType === "admin";

  const {
      fullName,
      bio,
      gender,
      birthDate,
      country,
      city,
      birthCountry,
      birthCity,
      height,
      education,
      hobbies,
      pets,
      favoritePerfume,
      profilePic,
      accountType: _ignoredAccountType,
    } = req.body;

    if (
      !fullName ||
      !gender ||
      !birthDate ||
      !country ||
      !city
    ) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !gender && "gender",
          !birthDate && "birthDate",
          !country && "country",
          !city && "city",
        ].filter(Boolean),
      });
    }

    const updatePayload = {
      fullName,
      bio: bio || "",
      gender,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      country,
      city,
      birthCountry: birthCountry || "",
      birthCity: birthCity || "",
      birthLocation: [birthCity, birthCountry].filter(Boolean).join(", "),
      height: height || "",
      education: education || "",
      hobbies: hobbies || "",
      pets: pets || "",
      favoritePerfume: favoritePerfume || "",
      location: [city, country].filter(Boolean).join(", "),
      isOnboarded: true,
    };

    const resolvedStaticAvatarPath = resolveAvatarPath(profilePic);
    const isInlineImage =
      typeof profilePic === "string" && profilePic.trim().startsWith("data:");
    // Uploaded photos are set via POST /api/avatars; resubmitting that URL here keeps it as is.
    const keepsUploadedAvatar = isUploadedAvatarUrl(profilePic);

    // Everyone may pick from the curated pool; admins may also link an external image URL.
    // Image data (data: URLs) is never stored in the user document.
    if (
      profilePic &&
      !isInlineImage &&
      !keepsUploadedAvatar &&
      (isAdmin || resolvedStaticAvatarPath)
    ) {
      const version = Date.now();
      const avatarSource = resolvedStaticAvatarPath
        ? buildAssetUrl(resolvedStaticAvatarPath)
        : profilePic;
      updatePayload.avatarVersion = version;
      updatePayload.profilePic = withAvatarVersion(avatarSource, version);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
      new: true,
    });

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // Switched from an uploaded photo to another picture: remove the stored image (no orphans).
    if (updatePayload.profilePic && !isUploadedAvatarUrl(updatePayload.profilePic)) {
      await deleteAvatarForUser(userId);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


