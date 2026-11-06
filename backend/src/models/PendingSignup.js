import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    profilePic: { type: String, default: "" },
    verificationCode: { type: String, required: true },
    verificationCodeExpiresAt: { type: Date, required: true },
    verificationAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Unverified signups (they hold a password hash) are removed automatically 24h after the code expired.
pendingSignupSchema.index(
  { verificationCodeExpiresAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 }
);

const PendingSignup = mongoose.model("PendingSignup", pendingSignupSchema);

export default PendingSignup;
