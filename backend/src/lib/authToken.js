import jwt from "jsonwebtoken";

export const AUTH_TOKEN_TTL = "7d";

// The token carries the user's tokenVersion ("tv"). Changing or resetting the password
// increments tokenVersion, which invalidates every token issued before.
export const signAuthToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET_KEY,
    { expiresIn: AUTH_TOKEN_TTL }
  );

// Returns the decoded payload, or null for a missing, malformed, forged or expired token.
export const verifyAuthToken = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return decoded?.userId ? decoded : null;
  } catch {
    return null;
  }
};

// Tokens issued before tokenVersion existed have no "tv" and count as version 0.
export const isTokenCurrent = (decoded, user) =>
  (decoded?.tv ?? 0) === (user?.tokenVersion ?? 0);
