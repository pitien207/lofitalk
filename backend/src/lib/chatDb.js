import mongoose from "mongoose";
import { mongoConnectionOptions } from "./db.js";

let chatConnection = null;

export const connectChatDB = async () => {
  if (chatConnection) return chatConnection;

  const chatUri = process.env.CHAT_MONGO_URI;

  // Without a separate chat database, reuse the main connection (one pool, fewer connections).
  if (!chatUri || chatUri === process.env.MONGO_URI) {
    chatConnection = mongoose.connection;
    console.log("Chat MongoDB uses the main connection");
    return chatConnection;
  }

  chatConnection = await mongoose
    .createConnection(chatUri, mongoConnectionOptions)
    .asPromise();
  console.log(`Chat MongoDB connected: ${chatConnection.host}`);

  return chatConnection;
};

export const getChatDb = () => {
  if (!chatConnection) {
    throw new Error("Chat DB has not been initialized. Call connectChatDB first.");
  }
  return chatConnection;
};
