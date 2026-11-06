import mongoose from "mongoose";

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 10;

// True when an object contains MongoDB operators ($ne, $gt, ...) or prototype-pollution keys.
const hasUnsafeKeys = (value, depth = 0) => {
  if (!value || typeof value !== "object") return false;
  if (depth > MAX_DEPTH) return true;
  return Object.keys(value).some(
    (key) =>
      key.startsWith("$") ||
      FORBIDDEN_KEYS.has(key) ||
      hasUnsafeKeys(value[key], depth + 1)
  );
};

// Blocks NoSQL injection such as {"email": {"$ne": null}} in JSON bodies or ?a[$ne]=1 queries.
// No legitimate request of this app sends keys starting with "$".
export const rejectMongoOperators = (req, res, next) => {
  if (hasUnsafeKeys(req.body) || hasUnsafeKeys(req.query)) {
    return res
      .status(400)
      .json({ code: "INVALID_INPUT", message: "Invalid request data." });
  }
  return next();
};

// Fields that must be plain values (string/number/boolean) when present, never objects or arrays.
export const requireScalarFields =
  (...fields) =>
  (req, res, next) => {
    const body = req.body || {};
    const invalid = fields.find(
      (field) =>
        body[field] !== undefined &&
        body[field] !== null &&
        !["string", "number", "boolean"].includes(typeof body[field])
    );
    if (invalid) {
      return res
        .status(400)
        .json({ code: "INVALID_INPUT", message: `Invalid value for "${invalid}".` });
    }
    return next();
  };

// Schema validation (zod, schemas in src/validation/schemas.js). It only checks:
// the request data the controller receives is left untouched, so unknown extra
// fields from older clients (e.g. the mobile app) keep working.
const formatIssues = (issues = []) =>
  issues.slice(0, 10).map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

export const validate =
  ({ body, query } = {}) =>
  (req, res, next) => {
    for (const [part, schema] of [
      ["body", body],
      ["query", query],
    ]) {
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const errors = formatIssues(result.error.issues);
        const first = errors[0];
        return res.status(400).json({
          code: "INVALID_INPUT",
          message: first?.message || "Invalid request data.",
          errors,
        });
      }
    }
    return next();
  };

// For router.param(): malformed ids get a clean 400 instead of a Mongoose CastError (500).
export const requireObjectIdParam = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({ code: "INVALID_ID", message: "Invalid id." });
  }
  return next();
};
