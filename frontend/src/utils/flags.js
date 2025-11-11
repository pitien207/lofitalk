import vietnamFlag from "../pictures/flags/vietnam.png";
import germanyFlag from "../pictures/flags/germany.png";
import japanFlag from "../pictures/flags/japan.png";
import australiaFlag from "../pictures/flags/australia.png";

export const countryFlagMap = {
  Vietnam: vietnamFlag,
  Germany: germanyFlag,
  Japan: japanFlag,
  Australia: australiaFlag,
};

const FLAG_ALIASES = {
  vietnam: "Vietnam",
  "việt nam": "Vietnam",
  vn: "Vietnam",
  germany: "Germany",
  deutschland: "Germany",
  "đức": "Germany",
  japan: "Japan",
  nihon: "Japan",
  "nhật bản": "Japan",
  australia: "Australia",
  australien: "Australia",
  "úc": "Australia",
};

const CITY_COUNTRY_MAP = {
  hanoi: "Vietnam",
  "ho chi minh city": "Vietnam",
  "da nang": "Vietnam",
  berlin: "Germany",
  munich: "Germany",
  hamburg: "Germany",
  tokyo: "Japan",
  osaka: "Japan",
  kyoto: "Japan",
  sydney: "Australia",
  melbourne: "Australia",
  brisbane: "Australia",
};

const normalize = (value) =>
  value ? value.toString().trim().toLowerCase() : "";

const resolveCountry = (value) => {
  const key = normalize(value);
  if (!key) return null;

  if (countryFlagMap[value]) {
    return countryFlagMap[value];
  }

  const alias = FLAG_ALIASES[key];
  if (alias && countryFlagMap[alias]) {
    return countryFlagMap[alias];
  }

  return null;
};

const resolveCity = (value) => {
  const match = CITY_COUNTRY_MAP[normalize(value)];
  if (match) {
    return countryFlagMap[match] || null;
  }
  return null;
};

export const getCountryFlag = (country, city, location) => {
  const fromCountry = resolveCountry(country);
  if (fromCountry) return fromCountry;

  const fromCity = resolveCity(city);
  if (fromCity) return fromCity;

  if (location) {
    const parts = location
      .split(/[,|-]/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const part of parts) {
      const flag = resolveCountry(part) || resolveCity(part);
      if (flag) return flag;
    }
  }

  return null;
};
