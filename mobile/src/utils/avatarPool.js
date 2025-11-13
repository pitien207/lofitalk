const boyAvatars = [
  require("../../assets/avatars/boy/AV1.png"),
  require("../../assets/avatars/boy/AV10.png"),
  require("../../assets/avatars/boy/AV11.png"),
  require("../../assets/avatars/boy/AV12.png"),
  require("../../assets/avatars/boy/AV13.png"),
  require("../../assets/avatars/boy/AV14.png"),
  require("../../assets/avatars/boy/AV15.png"),
  require("../../assets/avatars/boy/AV16.png"),
  require("../../assets/avatars/boy/AV17.png"),
  require("../../assets/avatars/boy/AV18.png"),
  require("../../assets/avatars/boy/AV19.png"),
  require("../../assets/avatars/boy/AV2.png"),
  require("../../assets/avatars/boy/AV20.png"),
  require("../../assets/avatars/boy/AV21.png"),
  require("../../assets/avatars/boy/AV22.png"),
  require("../../assets/avatars/boy/AV23.png"),
  require("../../assets/avatars/boy/AV24.png"),
  require("../../assets/avatars/boy/AV25.png"),
  require("../../assets/avatars/boy/AV26.png"),
  require("../../assets/avatars/boy/AV27.png"),
  require("../../assets/avatars/boy/AV28.png"),
  require("../../assets/avatars/boy/AV29.png"),
  require("../../assets/avatars/boy/AV3.png"),
  require("../../assets/avatars/boy/AV30.png"),
  require("../../assets/avatars/boy/AV31.png"),
  require("../../assets/avatars/boy/AV32.png"),
  require("../../assets/avatars/boy/AV33.png"),
  require("../../assets/avatars/boy/AV34.png"),
  require("../../assets/avatars/boy/AV35.png"),
  require("../../assets/avatars/boy/AV36.png"),
  require("../../assets/avatars/boy/AV37.png"),
  require("../../assets/avatars/boy/AV38.png"),
  require("../../assets/avatars/boy/AV39.png"),
  require("../../assets/avatars/boy/AV4.png"),
  require("../../assets/avatars/boy/AV40.png"),
  require("../../assets/avatars/boy/AV41.png"),
  require("../../assets/avatars/boy/AV42.png"),
  require("../../assets/avatars/boy/AV43.png"),
  require("../../assets/avatars/boy/AV44.png"),
  require("../../assets/avatars/boy/AV45.png"),
  require("../../assets/avatars/boy/AV46.png"),
  require("../../assets/avatars/boy/AV47.png"),
  require("../../assets/avatars/boy/AV48.png"),
  require("../../assets/avatars/boy/AV49.png"),
  require("../../assets/avatars/boy/AV5.png"),
  require("../../assets/avatars/boy/AV50.png"),
  require("../../assets/avatars/boy/AV6.png"),
  require("../../assets/avatars/boy/AV7.png"),
  require("../../assets/avatars/boy/AV8.png"),
  require("../../assets/avatars/boy/AV9.png"),
];

const girlAvatars = [
  require("../../assets/avatars/girl/AV100.png"),
  require("../../assets/avatars/girl/AV51.png"),
  require("../../assets/avatars/girl/AV52.png"),
  require("../../assets/avatars/girl/AV53.png"),
  require("../../assets/avatars/girl/AV54.png"),
  require("../../assets/avatars/girl/AV55.png"),
  require("../../assets/avatars/girl/AV56.png"),
  require("../../assets/avatars/girl/AV57.png"),
  require("../../assets/avatars/girl/AV58.png"),
  require("../../assets/avatars/girl/AV59.png"),
  require("../../assets/avatars/girl/AV60.png"),
  require("../../assets/avatars/girl/AV61.png"),
  require("../../assets/avatars/girl/AV62.png"),
  require("../../assets/avatars/girl/AV63.png"),
  require("../../assets/avatars/girl/AV64.png"),
  require("../../assets/avatars/girl/AV65.png"),
  require("../../assets/avatars/girl/AV66.png"),
  require("../../assets/avatars/girl/AV67.png"),
  require("../../assets/avatars/girl/AV68.png"),
  require("../../assets/avatars/girl/AV69.png"),
  require("../../assets/avatars/girl/AV70.png"),
  require("../../assets/avatars/girl/AV71.png"),
  require("../../assets/avatars/girl/AV72.png"),
  require("../../assets/avatars/girl/AV73.png"),
  require("../../assets/avatars/girl/AV74.png"),
  require("../../assets/avatars/girl/AV75.png"),
  require("../../assets/avatars/girl/AV76.png"),
  require("../../assets/avatars/girl/AV77.png"),
  require("../../assets/avatars/girl/AV78.png"),
  require("../../assets/avatars/girl/AV79.png"),
  require("../../assets/avatars/girl/AV80.png"),
  require("../../assets/avatars/girl/AV81.png"),
  require("../../assets/avatars/girl/AV82.png"),
  require("../../assets/avatars/girl/AV83.png"),
  require("../../assets/avatars/girl/AV84.png"),
  require("../../assets/avatars/girl/AV85.png"),
  require("../../assets/avatars/girl/AV86.png"),
  require("../../assets/avatars/girl/AV87.png"),
  require("../../assets/avatars/girl/AV88.png"),
  require("../../assets/avatars/girl/AV89.png"),
  require("../../assets/avatars/girl/AV90.png"),
  require("../../assets/avatars/girl/AV91.png"),
  require("../../assets/avatars/girl/AV92.png"),
  require("../../assets/avatars/girl/AV93.png"),
  require("../../assets/avatars/girl/AV94.png"),
  require("../../assets/avatars/girl/AV95.png"),
  require("../../assets/avatars/girl/AV96.png"),
  require("../../assets/avatars/girl/AV97.png"),
  require("../../assets/avatars/girl/AV98.png"),
  require("../../assets/avatars/girl/AV99.png"),
];

const allAvatars = [...boyAvatars, ...girlAvatars];

const normalizeGender = (gender = "") => gender.toLowerCase().trim();

export const getRandomAvatar = (gender) => {
  const normalized = normalizeGender(gender);
  let pool = allAvatars;

  if (["male", "man", "boy"].includes(normalized)) {
    pool = boyAvatars.length ? boyAvatars : allAvatars;
  } else if (["female", "woman", "girl"].includes(normalized)) {
    pool = girlAvatars.length ? girlAvatars : allAvatars;
  }

  if (!pool.length) {
    return null;
  }

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
};
