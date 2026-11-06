import mongoose from "mongoose";

const userReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Admin list sorts by status then newest; pending count filters by status;
// account deletion removes by reporter/target.
userReportSchema.index({ status: 1, createdAt: -1 });
userReportSchema.index({ reporter: 1 });
userReportSchema.index({ target: 1 });

const UserReport = mongoose.model("UserReport", userReportSchema);

export default UserReport;
