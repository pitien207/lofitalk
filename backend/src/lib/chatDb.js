import mongoose from "mongoose";

let chatConnection = null;

export const connectChatDB = async () => {
  if (chatConnection) return chatConnection;

  const uri = process.env.CHAT_MONGO_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("CHAT_MONGO_URI is not defined");
  }

  chatConnection = await mongoose.createConnection(uri).asPromise();
  console.log(`Chat MongoDB connected: ${chatConnection.host}`);

  return chatConnection;
};

export const getChatDb = () => {
  if (!chatConnection) {
    throw new Error("Chat DB has not been initialized. Call connectChatDB first.");
  }
  return chatConnection;
};
