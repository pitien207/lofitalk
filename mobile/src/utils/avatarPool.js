import { API_BASE_URL } from "../services/api";

const stripApiSuffix = (url) => url.replace(/\/api\/?$/, "");
const STATIC_BASE = stripApiSuffix(API_BASE_URL);

const buildUrl = (folder, file) =>
  `${STATIC_BASE}/static/avatars/${folder}/${file}`;

const boyFiles = [
  "AV1.png",
  "AV10.png",
  "AV11.png",
  "AV12.png",
  "AV13.png",
  "AV14.png",
  "AV15.png",
  "AV16.png",
  "AV17.png",
  "AV18.png",
  "AV19.png",
  "AV2.png",
  "AV20.png",
  "AV21.png",
  "AV22.png",
  "AV23.png",
  "AV24.png",
  "AV25.png",
  "AV26.png",
  "AV27.png",
  "AV28.png",
  "AV29.png",
  "AV3.png",
  "AV30.png",
  "AV31.png",
  "AV32.png",
  "AV33.png",
  "AV34.png",
  "AV35.png",
  "AV36.png",
  "AV37.png",
  "AV38.png",
  "AV39.png",
  "AV4.png",
  "AV40.png",
  "AV41.png",
  "AV42.png",
  "AV43.png",
  "AV44.png",
  "AV45.png",
  "AV46.png",
  "AV47.png",
  "AV48.png",
  "AV49.png",
  "AV5.png",
  "AV50.png",
  "AV6.png",
  "AV7.png",
  "AV8.png",
  "AV9.png",
];

const girlFiles = [
  "AV100.png",
  "AV51.png",
  "AV52.png",
  "AV53.png",
  "AV54.png",
  "AV55.png",
  "AV56.png",
  "AV57.png",
  "AV58.png",
  "AV59.png",
  "AV60.png",
  "AV61.png",
  "AV62.png",
  "AV63.png",
  "AV64.png",
  "AV65.png",
  "AV66.png",
  "AV67.png",
  "AV68.png",
  "AV69.png",
  "AV70.png",
  "AV71.png",
  "AV72.png",
  "AV73.png",
  "AV74.png",
  "AV75.png",
  "AV76.png",
  "AV77.png",
  "AV78.png",
  "AV79.png",
  "AV80.png",
  "AV81.png",
  "AV82.png",
  "AV83.png",
  "AV84.png",
  "AV85.png",
  "AV86.png",
  "AV87.png",
  "AV88.png",
  "AV89.png",
  "AV90.png",
  "AV91.png",
  "AV92.png",
  "AV93.png",
  "AV94.png",
  "AV95.png",
  "AV96.png",
  "AV97.png",
  "AV98.png",
  "AV99.png",
];

const boyAvatars = boyFiles.map((file) => buildUrl("boy", file));
const girlAvatars = girlFiles.map((file) => buildUrl("girl", file));
const allAvatars = [...boyAvatars, ...girlAvatars];

const normalizeGender = (gender = "") =>
  gender?.toString().toLowerCase().trim();

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
  }

  if (!pool.length) {
    return null;
  }

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
};
