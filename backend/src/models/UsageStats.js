import mongoose from "mongoose";

const usageStatsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },
    tarotReadings: {
      type: Number,
      default: 0,
    },
    fortuneCookieOpens: {
      type: Number,
      default: 0,
    },
    matchmindSessions: {
      type: Number,
      default: 0,
    },
    truthOrLieSessions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UsageStats", usageStatsSchema);

