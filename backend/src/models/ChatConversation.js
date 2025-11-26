import mongoose from "mongoose";
import { getChatDb } from "../lib/chatDb.js";

const conversationSchema = new mongoose.Schema(
  {
    roomKey: {
      type: String,
      required: true,
      unique: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessageText: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unreadByUser: {
      type: Map,
      of: Number,
      default: {},
    },
    clearedAtByUser: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

let ChatConversationModel;

export const getChatConversationModel = () => {
  if (!ChatConversationModel) {
    const chatDb = getChatDb();
    ChatConversationModel = chatDb.model(
      "ChatConversation",
      conversationSchema
    );
  }
  return ChatConversationModel;
};
