import UsageStats from "../models/UsageStats.js";

const DOC_KEY = "global";

const FEATURE_FIELD_MAP = {
  tarot: "tarotReadings",
  fortune: "fortuneCookieOpens",
  matchmind: "matchmindSessions",
  truthOrLie: "truthOrLieSessions",
};

const ensureStatsShape = (doc = {}) => ({
  tarotReadings: doc.tarotReadings ?? 0,
  fortuneCookieOpens: doc.fortuneCookieOpens ?? 0,
  matchmindSessions: doc.matchmindSessions ?? 0,
  truthOrLieSessions: doc.truthOrLieSessions ?? 0,
});

export const incrementUsageCounter = async (featureKey) => {
  const field = FEATURE_FIELD_MAP[featureKey];
  if (!field) return null;

  return UsageStats.findOneAndUpdate(
    { key: DOC_KEY },
    { $inc: { [field]: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

export const loadUsageStats = async () => {
  const statsDoc = await UsageStats.findOne({ key: DOC_KEY }).lean();
  return ensureStatsShape(statsDoc || {});
};

