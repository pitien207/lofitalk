import User from "../models/User.js";
// import PendingSignup from "../models/PendingSignup.js";
// import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  sendPasswordResetEmail,
  // sendVerificationEmail,
} from "../utils/email.js";
import { getRandomAvatar, resolveAvatarPath } from "../utils/avatarPool.js";

const CODE_EXPIRATION_MINUTES = 15;

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const buildAssetUrl = (relativePath) => {
  if (!relativePath) return "";

  const defaultBase =
    process.env.NODE_ENV === "production"
      ? "https://lofitalk.onrender.com"
      : `http://localhost:${process.env.PORT || 5001}`;

  const base =
    process.env.ASSET_BASE_URL ||
    process.env.APP_BASE_URL ||
    process.env.SERVER_URL ||
    process.env.API_BASE_URL ||
    defaultBase;

  try {
    return new URL(relativePath, base).toString();
  } catch (error) {
    return `${base.replace(/\/$/, "")}${relativePath}`;
  }
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const withAvatarVersion = (url, version) => {
  if (!url || url.startsWith("data:")) return url;
  const versionValue = version || Date.now();
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("v", versionValue);
    return parsed.toString();
  } catch (_err) {
    const [base, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    params.set("v", versionValue);
    return `${base}?${params.toString()}`;
  }
};

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.isEmailVerified
          ? "Email already exists, please use a different one"
          : "Please verify your email before logging in.",
      });
    }

    // const verificationCode = generateVerificationCode();
    // const verificationCodeExpiresAt = new Date(
    //   Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000
    // );

    const platformHeader = req.headers["x-client-platform"]?.toString().toLowerCase();
    const avatarSource = platformHeader === "web" ? "web" : "mobile";
    const randomAvatarPath = getRandomAvatar(undefined, avatarSource);
    const randomAvatar = randomAvatarPath
      ? withAvatarVersion(buildAssetUrl(randomAvatarPath))
      : "";

    // const hashedPassword = await bcrypt.hash(password, 10);

    /*
    await PendingSignup.findOneAndUpdate(
      { email },
      {
        fullName,
        passwordHash: hashedPassword,
        profilePic: randomAvatar,
        verificationCode,
        verificationCodeExpiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      success: true,
      message: "Verification code sent to your email address.",
    });
    */

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
      avatarVersion: Date.now(),
      isEmailVerified: true,
    });

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: toPublicUser(newUser),
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

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isEmailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect)
      return res.status(401).json({ message: "Invalid email or password" });

    user.isOnline = true;
    user.lastActiveAt = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    setAuthCookie(res, token);

    res.status(200).json({ success: true, token, user: toPublicUser(user) });
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
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

/*
export async function verifySignupCode(req, res) {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const normalizedCode = String(code).trim();

    let user = await User.findOne({ email });
    let pendingSignup = null;

    if (!user) {
      pendingSignup = await PendingSignup.findOne({ email });
      if (!pendingSignup) {
        return res.status(404).json({ message: "Signup session not found" });
      }

      if (
        !pendingSignup.verificationCode ||
        pendingSignup.verificationCode !== normalizedCode ||
        !pendingSignup.verificationCodeExpiresAt ||
        pendingSignup.verificationCodeExpiresAt < new Date()
      ) {
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    setAuthCookie(res, token);

    res.status(200).json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    console.log("Error verifying signup code:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
*/

export async function verifySignupCode(_req, res) {
  return res.status(410).json({
    success: false,
    message: "Verification step is currently disabled.",
  });
}

export async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log("Error updating password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

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
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email, verification code, and new password are required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    const normalizedCode = String(code).trim();
    if (
      !user.passwordResetCode ||
      user.passwordResetCode !== normalizedCode ||
      !user.passwordResetCodeExpiresAt ||
      user.passwordResetCodeExpiresAt < new Date()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpiresAt = undefined;
    await user.save();

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
      location: [city, country].filter(Boolean).join(", "),
      isOnboarded: true,
    };

    const resolvedStaticAvatarPath = resolveAvatarPath(profilePic);

    // Allow admins to upload custom avatars, but let everyone pick from the curated pool
    if (profilePic && (isAdmin || resolvedStaticAvatarPath)) {
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

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}




