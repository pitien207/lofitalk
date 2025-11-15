import jwt from "jsonwebtoken";
import User from "../models/User.js";

const ENERGY_MAX = 7;
const DAILY_ENERGY_GAIN = 1;

const refreshDailyEnergy = (user) => {
  if (typeof user.energy !== "number" || user.energy > ENERGY_MAX) {
    user.energy = Math.min(Math.max(user.energy ?? ENERGY_MAX, 0), ENERGY_MAX);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastRefillDate = user.lastEnergyRefill
    ? new Date(user.lastEnergyRefill)
    : today;
  lastRefillDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - lastRefillDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays > 0) {
    const gainedEnergy = diffDays * DAILY_ENERGY_GAIN;
    user.energy = Math.min(ENERGY_MAX, user.energy + gainedEnergy);
    user.lastEnergyRefill = today;
    return true;
  }

  return false;
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
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

    const shouldSave = refreshDailyEnergy(user);
    if (shouldSave) {
      await user.save();
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
