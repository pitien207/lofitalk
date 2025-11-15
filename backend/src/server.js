import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import tarotRoutes from "./routes/tarot.route.js";
import adminRoutes from "./routes/admin.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();

const allowedOrigins = (
  process.env.FRONTEND_URLS || "http://localhost:5173,https://lofitalk.onrender.com"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json());
app.use(cookieParser());

const frontendAvatarDirectory = path.join(
  __dirname,
  "..",
  "frontend",
  "src",
  "pictures",
  "avatars"
);

const mobileAvatarDirectory = path.join(
  __dirname,
  "..",
  "mobile",
  "assets",
  "avatars"
);

app.use("/static/avatars/frontend", express.static(frontendAvatarDirectory));
app.use("/static/avatars/web", express.static(frontendAvatarDirectory));
app.use("/static/avatars/mobile", express.static(mobileAvatarDirectory));
app.use("/static/avatars", express.static(mobileAvatarDirectory));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tarot", tarotRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

