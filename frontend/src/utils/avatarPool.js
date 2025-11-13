const boyModules = import.meta.glob("../pictures/avatars/boy/*.png", {
  eager: true,
});
const girlModules = import.meta.glob("../pictures/avatars/girl/*.png", {
  eager: true,
});

const boyAvatars = Object.values(boyModules).map((mod) => mod.default);
const girlAvatars = Object.values(girlModules).map((mod) => mod.default);
const allAvatars = [...boyAvatars, ...girlAvatars];

const normalizeGender = (gender = "") =>
  gender.toString().toLowerCase().trim();

export const getRandomAvatar = (gender) => {
  const normalized = normalizeGender(gender);

  let pool = allAvatars;
  if (normalized === "male" || normalized === "man" || normalized === "boy") {
    pool = boyAvatars.length ? boyAvatars : allAvatars;
  } else if (
    normalized === "female" ||
    normalized === "woman" ||
    normalized === "girl"
  ) {
    pool = girlAvatars.length ? girlAvatars : allAvatars;
  }

  if (!pool.length) {
    return "";
  }

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
};
