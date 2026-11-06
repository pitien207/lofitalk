import mongoose from "mongoose";

// One Web Push subscription per browser (endpoint). A browser that logs in with
// another account takes the subscription over (upsert by endpoint).
const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      maxlength: 2048,
    },
    keys: {
      p256dh: { type: String, required: true, maxlength: 256 },
      auth: { type: String, required: true, maxlength: 64 },
    },
    userAgent: {
      type: String,
      default: "",
      maxlength: 300,
    },
  },
  { timestamps: true }
);

const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
