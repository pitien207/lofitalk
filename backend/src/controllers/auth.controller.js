import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/email.js";

const CODE_EXPIRATION_MINUTES = 15;

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const setAuthCookie = (res, token) => {
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
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

    const verificationCode = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(
      Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000
    );

    let user = await User.findOne({ email });

    if (user) {
      if (user.isEmailVerified) {
        return res
          .status(400)
          .json({ message: "Email already exists, please use a different one" });
      }

      user.fullName = fullName;
      user.password = password;
      user.verificationCode = verificationCode;
      user.verificationCodeExpiresAt = verificationCodeExpiresAt;
      await user.save();
    } else {
      const idx = Math.floor(Math.random() * 100) + 1;
      const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

      user = await User.create({
        email,
        fullName,
        password,
        profilePic: randomAvatar,
        verificationCode,
        verificationCodeExpiresAt,
      });
    }

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      success: true,
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    setAuthCookie(res, token);

    res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function verifySignupCode(req, res) {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const normalizedCode = String(code).trim();

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

    try {
      await upsertStreamUser({
        id: user._id.toString(),
        name: user.fullName,
        image: user.profilePic || "",
      });
    } catch (streamError) {
      console.log("Error creating Stream user:", streamError);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    setAuthCookie(res, token);

    res.status(200).json({ success: true, user });
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

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const {
      fullName,
      bio,
      gender,
      birthDate,
      country,
      city,
      height,
      education,
      datingGoal,
      hobbies,
      pets,
      profilePic,
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
      height: height || "",
      education: education || "",
      datingGoal: datingGoal || "",
      hobbies: hobbies || "",
      pets: pets || "",
      location: [city, country].filter(Boolean).join(", "),
      isOnboarded: true,
    };

    if (profilePic) {
      updatePayload.profilePic = profilePic;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
      new: true,
    });

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(
        `Stream user updated after onboarding for ${updatedUser.fullName}`
      );
    } catch (streamError) {
      console.log(
        "Error updating Stream user during onboarding:",
        streamError.message
      );
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
