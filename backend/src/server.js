import "dotenv/config";
import fs from "fs";
import http from "http";
import https from "https";
import http2 from "http2";
import mongoose from "mongoose";

import app, { allowedOrigins } from "./app.js";
import { connectDB } from "./lib/db.js";
import { connectChatDB } from "./lib/chatDb.js";
import { setupChatSocket } from "./lib/chatSocket.js";
import { ensureIndexes } from "./lib/indexes.js";

const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

const ENABLE_HTTP2 = process.env.ENABLE_HTTP2 === "true";
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";

const loadTlsConfig = () => {
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;
  if (!keyPath || !certPath) return null;

  try {
    const baseConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    const caPath = process.env.SSL_CA_PATH;
    if (caPath) {
      baseConfig.ca = fs.readFileSync(caPath);
    }

    return baseConfig;
  } catch (err) {
    console.error("Failed to load TLS credentials", err.message);
    return null;
  }
};

const createServer = () => {
  const tlsConfig = loadTlsConfig();

  if (ENABLE_HTTP2 && tlsConfig) {
    return http2.createSecureServer(
      {
        ...tlsConfig,
        allowHTTP1: true, // fallback for clients without h2
      },
      app
    );
  }

  if ((ENABLE_HTTPS || ENABLE_HTTP2) && tlsConfig) {
    return https.createServer(tlsConfig, app);
  }

  return http.createServer(app);
};

const server = createServer();

setupChatSocket(server, allowedOrigins);

const startServer = async () => {
  try {
    await connectDB();
    await connectChatDB();

    server.listen(PORT, HOST, () => {
      console.log(`Server is running on ${HOST}:${PORT}`);
    });

    // Runs after listen so a cold start is not delayed; safe to repeat on every start.
    ensureIndexes().catch((error) => {
      console.error("Index creation failed:", error?.message || error);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Container platforms send SIGTERM before stopping a replica (e.g. scale to zero).
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  const forceExit = setTimeout(() => process.exit(0), 10000);
  forceExit.unref();
  server.close(async () => {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.error("Error while closing MongoDB connections:", error);
    }
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
