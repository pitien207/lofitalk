// Absolute URLs for files served by this backend (preset avatars, uploaded avatars).
// profilePic values are stored as absolute URLs so web and mobile can use them directly.
export const buildAssetUrl = (relativePath) => {
  if (!relativePath) return "";

  const defaultBase =
    process.env.NODE_ENV === "production"
      ? "https://lofitalk.nghiapham.org"
      : `http://localhost:${process.env.PORT || 5001}`;

  const base =
    process.env.ASSET_BASE_URL ||
    process.env.APP_BASE_URL ||
    process.env.SERVER_URL ||
    process.env.API_BASE_URL ||
    defaultBase;

  try {
    return new URL(relativePath, base).toString();
  } catch (error) {
    return `${base.replace(/\/$/, "")}${relativePath}`;
  }
};

// Adds/replaces ?v=<version> so browsers re-fetch an image after it changed.
export const withAvatarVersion = (url, version) => {
  if (!url || url.startsWith("data:")) return url;
  const versionValue = version || Date.now();
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("v", versionValue);
    return parsed.toString();
  } catch (_err) {
    const [base, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    params.set("v", versionValue);
    return `${base}?${params.toString()}`;
  }
};
