import fs from "fs";
import path from "path";

const projectRoot = path.resolve();
const avatarsDir = path.join(projectRoot, "mobile", "assets", "avatars");
const boyDir = path.join(avatarsDir, "boy");
const girlDir = path.join(avatarsDir, "girl");

const buildPublicPaths = (dir, subPath) => {
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => file.toLowerCase().endsWith(".png"))
      .map((file) => `/static/avatars/${subPath}/${file}`);
  } catch (error) {
    console.warn(`Unable to read avatars from ${dir}:`, error.message);
    return [];
  }
};

const boyAvatars = buildPublicPaths(boyDir, "boy");
const girlAvatars = buildPublicPaths(girlDir, "girl");
const allAvatars = [...boyAvatars, ...girlAvatars];

const normalizeGender = (gender = "") => gender.toLowerCase().trim();

export const getRandomAvatar = (gender) => {
  const normalized = normalizeGender(gender);
  let pool = allAvatars;

  if (["male", "man", "boy"].includes(normalized) && boyAvatars.length) {
    pool = boyAvatars;
  } else if (
    ["female", "woman", "girl"].includes(normalized) &&
    girlAvatars.length
  ) {
    pool = girlAvatars;
  } else if (!allAvatars.length) {
    return null;
  }

  if (!pool.length) {
    pool = allAvatars;
  }

  if (!pool.length) {
    return null;
  }

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
};
