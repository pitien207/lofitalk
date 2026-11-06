import mongoose from "mongoose";

// Works for local MongoDB and Azure DocumentDB alike. TLS, SCRAM-SHA-256 and
// retryWrites=false come from the DocumentDB connection string itself.
export const mongoConnectionOptions = {
  serverSelectionTimeoutMS: 15000,
  // Indexes are created explicitly (and awaited/logged) by ensureIndexes() in lib/indexes.js.
  autoIndex: false,
  maxPoolSize: Number.parseInt(process.env.MONGO_MAX_POOL_SIZE || "10", 10),
};

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, mongoConnectionOptions);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    // Log name/message only: never print the connection string.
    console.error(
      "Error in connecting to MongoDB:",
      error?.name,
      error?.message
    );
    process.exit(1); // 1 indicates failure
  }
};
