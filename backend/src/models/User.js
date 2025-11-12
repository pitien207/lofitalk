import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    birthDate: {
      type: Date,
    },
    country: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    height: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },
    datingGoal: {
      type: String,
      default: "",
    },
    hobbies: {
      type: String,
      default: "",
    },
    pets: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpiresAt: {
      type: Date,
    },
    passwordResetCode: {
      type: String,
    },
    passwordResetCodeExpiresAt: {
      type: Date,
    },
    location: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    energy: {
      type: Number,
      min: 0,
      max: 7,
      default: 7,
    },
    lastEnergyRefill: {
      type: Date,
      default: () => new Date(),
    },
    lastTarotReading: {
      questions: {
        type: [String],
        default: undefined,
      },
      cards: {
        type: [
          {
            name: String,
            reversed: Boolean,
          },
        ],
        default: undefined,
      },
      result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

//pre hook to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  const isPasswordCorrect = await bcrypt.compare(
    enteredPassword,
    this.password
  );
  return isPasswordCorrect;
};

const User = mongoose.model("User", userSchema);

export default User;
