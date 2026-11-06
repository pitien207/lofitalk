import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Liveness: the process is up and serving HTTP. Never depends on the database,
// so a database outage does not make the platform restart the container in a loop.
router.get("/", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok" });
});

// Readiness: the app can reach MongoDB (connection open + ping within 3 s).
router.get("/ready", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: "unavailable", database: "disconnected" });
    }
    await Promise.race([
      mongoose.connection.db.command({ ping: 1 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    return res.status(200).json({ status: "ok", database: "up" });
  } catch {
    return res.status(503).json({ status: "unavailable", database: "unreachable" });
  }
});

export default router;
