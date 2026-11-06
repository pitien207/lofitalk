import User from "../models/User.js";
import { isTokenCurrent, verifyAuthToken } from "../lib/authToken.js";
import { getActiveBan, suspendedResponse } from "../lib/accountStatus.js";
import { DAILY_ENERGY_GAIN, ENERGY_MAX } from "../lib/energy.js";

const PRESENCE_TOUCH_INTERVAL_MS = parseInt(
  process.env.USER_PRESENCE_TOUCH_MS || "60000",
  10
);

// Daily energy regeneration (same rules as before): returns the fields to write, or null.
const computeEnergyUpdate = (user) => {
  let energy = user.energy;
  if (typeof energy !== "number" || energy > ENERGY_MAX) {
    energy = Math.min(Math.max(energy ?? ENERGY_MAX, 0), ENERGY_MAX);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastRefillDate = user.lastEnergyRefill ? new Date(user.lastEnergyRefill) : today;
  lastRefillDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - lastRefillDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays > 0) {
    return {
      energy: Math.min(ENERGY_MAX, energy + diffDays * DAILY_ENERGY_GAIN),
      lastEnergyRefill: today,
    };
  }
  return energy !== user.energy ? { energy } : null;
};

// Applies already-persisted values to the loaded document without marking them dirty,
// so a later req.user.save() in a controller does not write them again.
const applyPersisted = (user, values) => {
  user.set(values);
  Object.keys(values).forEach((key) => user.unmarkModified(key));
};

// Presence + daily energy, written with atomic updates instead of saving the whole document.
const touchUser = async (user) => {
  const now = new Date();
  const lastActiveAt = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
  const shouldTouchPresence =
    !user.isOnline ||
    !lastActiveAt ||
    now.getTime() - lastActiveAt.getTime() >= PRESENCE_TOUCH_INTERVAL_MS;

  const presence = shouldTouchPresence ? { isOnline: true, lastActiveAt: now } : null;
  const energyUpdate = computeEnergyUpdate(user);
  const gainsEnergy = Boolean(energyUpdate?.lastEnergyRefill);

  if (!presence && !gainsEnergy) {
    // Out-of-range energy is only corrected together with a write, as before.
    return;
  }

  if (gainsEnergy) {
    // Conditional on the old refill date: parallel requests grant the daily gain only once.
    const result = await User.updateOne(
      { _id: user._id, lastEnergyRefill: user.lastEnergyRefill ?? null },
      { $set: { ...energyUpdate, ...(presence || {}) } }
    );
    if (result.matchedCount === 1) {
      applyPersisted(user, { ...energyUpdate, ...(presence || {}) });
      return;
    }
    // Another request already applied today's gain: reload those fields.
    const fresh = await User.findById(user._id).select("energy lastEnergyRefill").lean();
    if (fresh) applyPersisted(user, { energy: fresh.energy, lastEnergyRefill: fresh.lastEnergyRefill });
  }

  if (presence) {
    const values = { ...presence, ...(energyUpdate && !gainsEnergy ? energyUpdate : {}) };
    await User.updateOne({ _id: user._id }, { $set: values });
    applyPersisted(user, values);
  }
};

export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.jwt;

    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Malformed, forged or expired tokens are an auth failure (401), not a server error.
    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Not authorized, token failed" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    // Issued before the last password change/reset.
    if (!isTokenCurrent(decoded, user)) {
      return res
        .status(401)
        .json({ message: "Session expired, please log in again" });
    }

    const ban = getActiveBan(user);
    if (ban) {
      return res.status(403).json(suspendedResponse(ban));
    }

    await touchUser(user);

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.accountType !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
