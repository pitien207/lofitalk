// Small in-memory sliding-window limiter for Socket.IO events (one replica, so memory is enough).
export const createSocketRateLimiter = ({ limit, windowMs }) => {
  const hits = new Map(); // key -> timestamps inside the window

  const allow = (key) => {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };

  // Drop idle keys so the map does not grow forever.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, times] of hits) {
      const recent = times.filter((time) => now - time < windowMs);
      if (recent.length) hits.set(key, recent);
      else hits.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  return { allow };
};

// Chat messages: 20 per 10 seconds per user.
export const messageLimiter = createSocketRateLimiter({ limit: 20, windowMs: 10_000 });

// Game invites (MatchMind / Truth or Lie): 10 per minute per user.
export const inviteLimiter = createSocketRateLimiter({ limit: 10, windowMs: 60_000 });
