import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    profilePic: { type: String, default: "" },
    verificationCode: { type: String, required: true },
    verificationCodeExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const PendingSignup = mongoose.model("PendingSignup", pendingSignupSchema);

export default PendingSignup;
