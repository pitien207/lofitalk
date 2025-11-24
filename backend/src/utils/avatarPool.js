import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const avatarRoot =
  process.env.AVATAR_ROOT || path.join(currentDir, "..", "assets", "avatars");

const DEFAULT_AVATAR_PREFIX = "/static/avatars";
const MOBILE_PREFIX =
  process.env.MOBILE_AVATAR_STATIC_PATH || DEFAULT_AVATAR_PREFIX;
const WEB_PREFIX = process.env.WEB_AVATAR_STATIC_PATH || DEFAULT_AVATAR_PREFIX;

const SUPPORTED_EXTENSIONS = [".avif", ".webp", ".png"];
const extensionRank = {
  ".avif": 0,
  ".webp": 1,
  ".png": 2,
};

const buildPublicPaths = (dir, prefix, subPath) => {
  try {
    const bestByBase = new Map();

    fs.readdirSync(dir)
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
      })
      .forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        const base = path.basename(file, ext);
        const current = bestByBase.get(base);
        if (!current || extensionRank[ext] < extensionRank[current.ext]) {
          bestByBase.set(base, { file, ext });
        }
      });

    return Array.from(bestByBase.values()).map(
      ({ file }) => `${prefix}/${subPath}/${file}`
    );
  } catch (error) {
    console.warn(`Unable to read avatars from ${dir}:`, error.message);
    return [];
  }
};

const createAvatarPool = (baseDir, prefix) => {
  const boyDir = path.join(baseDir, "boy");
  const girlDir = path.join(baseDir, "girl");

  const boy = buildPublicPaths(boyDir, prefix, "boy");
  const girl = buildPublicPaths(girlDir, prefix, "girl");
  const all = [...boy, ...girl];

  return { boy, girl, all };
};

const mobilePool = createAvatarPool(avatarRoot, MOBILE_PREFIX);
const webPool = createAvatarPool(avatarRoot, WEB_PREFIX);

const normalizeGender = (gender = "") => gender.toLowerCase().trim();

const pickFromPool = (pool, gender) => {
  if (!pool) return null;
  const normalized = normalizeGender(gender);

  let options = pool.all;
  if (["male", "man", "boy"].includes(normalized) && pool.boy.length) {
    options = pool.boy;
  } else if (["female", "woman", "girl"].includes(normalized) && pool.girl.length) {
    options = pool.girl;
  }

  if (!options.length) {
    options = pool.all;
  }

  if (!options.length) {
    return null;
  }

  const idx = Math.floor(Math.random() * options.length);
  return options[idx];
};

export const getRandomAvatar = (gender, source = "mobile") => {
  const pool = source === "web" ? webPool : mobilePool;
  return pickFromPool(pool, gender);
};

export const getRandomWebAvatar = (gender) => getRandomAvatar(gender, "web");
export const getRandomMobileAvatar = (gender) => getRandomAvatar(gender, "mobile");
