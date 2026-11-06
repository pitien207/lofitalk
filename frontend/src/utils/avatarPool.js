import { getPresetAvatars } from "../lib/api";

// The preset avatar list comes from the server (GET /api/meta/avatars), so the
// files in backend/src/assets/avatars are the only place to add or remove one.
let presetAvatarsPromise = null;

const loadPresetAvatars = () => {
  if (!presetAvatarsPromise) {
    presetAvatarsPromise = getPresetAvatars().catch((error) => {
      presetAvatarsPromise = null; // retry on the next click
      throw error;
    });
  }
  return presetAvatarsPromise;
};

const normalizeGender = (gender = "") =>
  gender.toString().toLowerCase().trim();

// Resolves to a random preset avatar URL for the gender, or "" if none is available.
export const getRandomAvatar = async (gender) => {
  let boy = [];
  let girl = [];
  try {
    ({ boy = [], girl = [] } = await loadPresetAvatars());
  } catch {
    return "";
  }

  const normalized = normalizeGender(gender);
  let pool = [...boy, ...girl];
  if (["male", "man", "boy"].includes(normalized) && boy.length) {
    pool = boy;
  } else if (["female", "woman", "girl"].includes(normalized) && girl.length) {
    pool = girl;
  }

  if (!pool.length) return "";
  return pool[Math.floor(Math.random() * pool.length)];
};
