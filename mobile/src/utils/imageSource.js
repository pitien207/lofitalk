import Logo from "../../assets/LofiTalk_logo.png";
import { STATIC_BASE_URL } from "../config";

const STATIC_BASE = STATIC_BASE_URL;

const buildAbsoluteUrl = (value) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const isAbsolute = /^https?:\/\//i.test(trimmed);
  if (isAbsolute) return trimmed;
  const needsSlash = trimmed.startsWith("/") ? "" : "/";
  return `${STATIC_BASE}${needsSlash}${trimmed}`;
};

export const resolveImageSource = (value) => {
  if (!value) return Logo;
  if (typeof value === "string") {
    const url = buildAbsoluteUrl(value);
    return url ? { uri: url } : Logo;
  }
  return value;
};
