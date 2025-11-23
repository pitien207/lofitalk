import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import tarotRoutes from "./routes/tarot.route.js";
import adminRoutes from "./routes/admin.route.js";
import metaRoutes from "./routes/meta.route.js";

import { connectDB } from "./lib/db.js";
import { connectChatDB } from "./lib/chatDb.js";
import { setupChatSocket } from "./lib/chatSocket.js";

const app = express();
const PORT = process.env.PORT;
const server = http.createServer(app);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..");

const AVATAR_VERSIONED_CACHE_SECONDS = parseInt(
  process.env.AVATAR_VERSIONED_CACHE_SECONDS || "2592000",
  10
); // 30 days when ?v= is present
const FRONTEND_STATIC_CACHE_SECONDS = parseInt(
  process.env.FRONTEND_STATIC_CACHE_SECONDS || "31536000",
  10
); // 1 year for hashed assets

const allowedOrigins = (
  process.env.FRONTEND_URLS || "http://localhost:5173,https://lofitalk.onrender.com"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(compression());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));
app.use(cookieParser());

const avatarDirectory =
  process.env.AVATAR_ROOT || path.join(currentDir, "assets", "avatars");

const avatarCacheMiddleware = (req, res, next) => {
  const hasVersion = Boolean(req.query?.v);
  if (hasVersion) {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${AVATAR_VERSIONED_CACHE_SECONDS}, immutable`
    );
  } else {
    // No version: always revalidate to pick up latest avatar changes immediately
    res.setHeader("Cache-Control", "public, no-cache");
  }
  next();
};

const avatarStatic = express.static(avatarDirectory, { etag: true });
app.use("/static/avatars/mobile", avatarCacheMiddleware, avatarStatic);
app.use("/static/avatars/web", avatarCacheMiddleware, avatarStatic);
app.use("/static/avatars", avatarCacheMiddleware, avatarStatic);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tarot", tarotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);

if (process.env.NODE_ENV === "production") {
  const frontendDist =
    process.env.FRONTEND_DIST ||
    path.join(backendRoot, "..", "frontend", "dist");

  app.use(
    express.static(frontendDist, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        } else {
          res.setHeader(
            "Cache-Control",
            `public, max-age=${FRONTEND_STATIC_CACHE_SECONDS}, immutable`
          );
        }
      },
    })
  );

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

setupChatSocket(server, allowedOrigins);

const startServer = async () => {
  try {
    await connectDB();
    await connectChatDB();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

