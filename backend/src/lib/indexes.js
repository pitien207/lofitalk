import mongoose from "mongoose";

// Import every model so its schema (and indexes) is registered.
import "../models/AdminNotification.js";
import "../models/Avatar.js";
import "../models/Announcement.js";
import "../models/FriendRequest.js";
import "../models/PendingSignup.js";
import "../models/UsageStats.js";
import "../models/User.js";
import "../models/UserReport.js";
import { getChatConversationModel } from "../models/ChatConversation.js";
import { getChatMessageModel } from "../models/ChatMessage.js";

// Creates all schema indexes (unique, compound, TTL) explicitly and reports failures.
// createIndexes() is idempotent: existing identical indexes are left untouched,
// so this is safe on every start, including against a brand-new empty database.
export const ensureIndexes = async () => {
  const models = new Set([
    ...Object.values(mongoose.models),
    getChatConversationModel(),
    getChatMessageModel(),
  ]);

  const results = await Promise.allSettled(
    [...models].map(async (model) => {
      await model.createIndexes();
      return model.modelName;
    })
  );

  const failed = results.filter((result) => result.status === "rejected");
  failed.forEach((result) => {
    console.error("Index creation failed:", result.reason?.message || result.reason);
  });

  console.log(
    `Indexes ensured for ${results.length - failed.length}/${results.length} models`
  );
};
