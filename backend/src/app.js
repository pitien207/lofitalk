import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import tarotRoutes from "./routes/tarot.route.js";
import adminRoutes from "./routes/admin.route.js";
import metaRoutes from "./routes/meta.route.js";
import avatarRoutes from "./routes/avatar.route.js";
import pushRoutes from "./routes/push.route.js";
import healthRoutes from "./routes/health.route.js";
import { rejectMongoOperators } from "./middleware/validate.middleware.js";

// Express app without a listening server, so tests can mount it on an ephemeral port.
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

export const allowedOrigins = (process.env.FRONTEND_URLS || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const app = express();
app.disable("x-powered-by");
// Azure Container Apps ingress is one proxy hop: trust exactly that hop so req.ip is the
// real client IP (used by rate limits) and spoofed X-Forwarded-For entries are ignored.
app.set("trust proxy", Number.parseInt(process.env.TRUST_PROXY_HOPS || "1", 10));

// Security headers. The web app only loads its own scripts/styles/fonts; images may also be
// blob: previews or https URLs (admins can link external avatars); realtime uses WebSockets
// on the app's own origin.
const allOriginsHttps = allowedOrigins.every((origin) => origin.startsWith("https://"));
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "media-src": ["'self'", "data:", "blob:"],
        "connect-src": [
          "'self'",
          ...allowedOrigins.map((origin) => origin.replace(/^http/, "ws")),
        ],
        "font-src": ["'self'", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "frame-ancestors": ["'none'"],
        // Only when every public origin is HTTPS (keeps local http testing working).
        "upgrade-insecure-requests": allOriginsHttps ? [] : null,
      },
    },
    // same-site (not same-origin) so the Vite dev server can load API-served images.
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);
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
// Reject {"$ne": ...}-style payloads before any route builds a MongoDB query from them.
app.use(rejectMongoOperators);

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

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tarot", tarotRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/avatars", avatarRoutes);
app.use("/api/push", pushRoutes);

if (process.env.NODE_ENV === "production") {
  const frontendDist =
    process.env.FRONTEND_DIST ||
    path.join(backendRoot, "..", "frontend", "dist");

  app.use(
    express.static(frontendDist, {
      setHeaders: (res, filePath) => {
        // Only Vite's hashed build output (dist/assets) may be cached forever.
        // index.html, sw.js, manifest and icons keep their names: revalidate them.
        const isHashedAsset = path
          .relative(frontendDist, filePath)
          .split(path.sep)[0] === "assets";
        if (!isHashedAsset) {
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

export default app;
