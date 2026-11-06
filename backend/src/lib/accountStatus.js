// Account suspension helpers (shared by login, protectRoute and the socket handshake).
export const PERMANENT_BAN_DATE = new Date("9999-12-31T00:00:00.000Z");

// Active suspension info, or null when the account is not suspended.
export const getActiveBan = (user) => {
  if (!user?.bannedUntil) return null;
  const until = new Date(user.bannedUntil);
  if (until.getTime() <= Date.now()) return null;
  return {
    until,
    permanent: until.getTime() >= PERMANENT_BAN_DATE.getTime(),
    reason: user.banReason || "",
  };
};

export const suspendedResponse = (ban) => ({
  code: "ACCOUNT_SUSPENDED",
  message: "This account is suspended.",
  bannedUntil: ban.permanent ? null : ban.until,
  permanent: ban.permanent,
  reason: ban.reason,
});
