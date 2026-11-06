import { useMemo } from "react";
import { useTranslation } from "../languages/useTranslation";

// Single source of truth for the profile select lists used by the profile
// editor (HomePage), onboarding and the friend filters. `value` is what is
// stored in the database; `key` is the translation key for the label.

export const GENDER_VALUES = [
  { value: "female", key: "onboarding.genderOptions.female" },
  { value: "male", key: "onboarding.genderOptions.male" },
  { value: "non-binary", key: "onboarding.genderOptions.nonBinary" },
  { value: "prefer_not_say", key: "onboarding.genderOptions.preferNotSay" },
];

const city = (country, id, value) => ({
  value,
  key: `onboarding.cityOptions.${country}.${id}`,
});

const COUNTRIES = [
  {
    value: "Vietnam",
    key: "onboarding.countryOptions.vietnam",
    cities: [
      city("vietnam", "cantho", "Can Tho"),
      city("vietnam", "dalat", "Da Lat"),
      city("vietnam", "danang", "Da Nang"),
      city("vietnam", "haiphong", "Hai Phong"),
      city("vietnam", "hanoi", "Hanoi"),
      city("vietnam", "hcmc", "Ho Chi Minh City"),
      city("vietnam", "hue", "Hue"),
      city("vietnam", "namdinh", "Nam Dinh"),
      city("vietnam", "nghean", "Nghe An"),
      city("vietnam", "ninhbinh", "Ninh Binh"),
      city("vietnam", "quynhon", "Quy Nhon"),
      city("vietnam", "thanhhoa", "Thanh Hoa"),
      city("vietnam", "vinh", "Vinh"),
      city("vietnam", "vungtau", "Vung Tau"),
    ],
  },
  {
    value: "Germany",
    key: "onboarding.countryOptions.germany",
    cities: [
      city("germany", "berlin", "Berlin"),
      city("germany", "bonn", "Bonn"),
      city("germany", "bremen", "Bremen"),
      city("germany", "koln", "Cologne"),
      city("germany", "dresden", "Dresden"),
      city("germany", "dusseldorf", "Dusseldorf"),
      city("germany", "frankfurt", "Frankfurt"),
      city("germany", "hanover", "Hanover"),
      city("germany", "hamburg", "Hamburg"),
      city("germany", "leipzig", "Leipzig"),
      city("germany", "munich", "Munich"),
      city("germany", "nurnberg", "Nuremberg"),
      city("germany", "stuttgart", "Stuttgart"),
      city("germany", "essen", "Essen"),
      city("germany", "dortmund", "Dortmund"),
      city("germany", "bochum", "Bochum"),
      city("germany", "karlsruhe", "Karlsruhe"),
      city("germany", "aachen", "Aachen"),
      city("germany", "freiburg", "Freiburg"),
      city("germany", "regensburg", "Regensburg"),
    ],
  },
  {
    value: "Japan",
    key: "onboarding.countryOptions.japan",
    cities: [
      city("japan", "fukuoka", "Fukuoka"),
      city("japan", "hiroshima", "Hiroshima"),
      city("japan", "kobe", "Kobe"),
      city("japan", "kyoto", "Kyoto"),
      city("japan", "nagoya", "Nagoya"),
      city("japan", "osaka", "Osaka"),
      city("japan", "sapporo", "Sapporo"),
      city("japan", "sendai", "Sendai"),
      city("japan", "tokyo", "Tokyo"),
      city("japan", "yokohama", "Yokohama"),
    ],
  },
  {
    value: "Australia",
    key: "onboarding.countryOptions.australia",
    cities: [
      city("australia", "adelaide", "Adelaide"),
      city("australia", "brisbane", "Brisbane"),
      city("australia", "canberra", "Canberra"),
      city("australia", "goldcoast", "Gold Coast"),
      city("australia", "melbourne", "Melbourne"),
      city("australia", "perth", "Perth"),
      city("australia", "sydney", "Sydney"),
    ],
  },
];

const birthCity = (id, value) => ({
  value,
  key: `onboarding.birthCityOptions.vietnam.${id}`,
});

const BIRTH_COUNTRIES = [
  {
    value: "Vietnam",
    key: "onboarding.birthCountryOptions.vietnam",
    cities: [
      birthCity("hanoi", "Hanoi"),
      birthCity("hochiminh", "Ho Chi Minh City"),
      birthCity("haiphong", "Hai Phong"),
      birthCity("danang", "Da Nang"),
      birthCity("cantho", "Can Tho"),
      birthCity("thuathienhue", "Thua Thien Hue"),
      birthCity("khanhhoa", "Khanh Hoa"),
      birthCity("binhdinh", "Binh Dinh"),
      birthCity("nghean", "Nghe An"),
      birthCity("daklak", "Dak Lak"),
      birthCity("lamdong", "Lam Dong"),
      birthCity("dongnai", "Dong Nai"),
      birthCity("binhduong", "Binh Duong"),
      birthCity("quangninh", "Quang Ninh"),
      birthCity("thanhhoa", "Thanh Hoa"),
      birthCity("haiduong", "Hai Duong"),
      birthCity("namdinh", "Nam Dinh"),
      birthCity("thainguyen", "Thai Nguyen"),
      birthCity("phutho", "Phu Tho"),
      birthCity("kiengiang", "Kien Giang"),
      birthCity("bacninh", "Bac Ninh"),
      birthCity("bacgiang", "Bac Giang"),
      birthCity("hanam", "Ha Nam"),
      birthCity("ninhbinh", "Ninh Binh"),
      birthCity("hatinh", "Ha Tinh"),
      birthCity("quangbinh", "Quang Binh"),
      birthCity("quangtri", "Quang Tri"),
      birthCity("quangngai", "Quang Ngai"),
      birthCity("binhthuan", "Binh Thuan"),
      birthCity("angiang", "An Giang"),
    ],
  },
];

const EDUCATION_VALUES = [
  { value: "High school graduate", key: "onboarding.educationOptions.highSchool" },
  { value: "University", key: "onboarding.educationOptions.university" },
  { value: "Vocational training", key: "onboarding.educationOptions.vocational" },
  { value: "Working professional", key: "onboarding.educationOptions.working" },
];

const HOBBY_VALUES = [
  { value: "Music & concerts", key: "onboarding.hobbyOptions.music" },
  { value: "Traveling", key: "onboarding.hobbyOptions.travel" },
  { value: "Cooking & baking", key: "onboarding.hobbyOptions.cooking" },
  { value: "Video games", key: "onboarding.hobbyOptions.gaming" },
  { value: "Reading", key: "onboarding.hobbyOptions.reading" },
  { value: "Fitness & gym", key: "onboarding.hobbyOptions.fitness" },
  { value: "Photography", key: "onboarding.hobbyOptions.photography" },
  { value: "Art & design", key: "onboarding.hobbyOptions.art" },
  { value: "Movies & series", key: "onboarding.hobbyOptions.movies" },
  { value: "Hiking & outdoors", key: "onboarding.hobbyOptions.outdoors" },
];

const PET_VALUES = [
  { value: "Dog", key: "onboarding.petOptions.dog" },
  { value: "Cat", key: "onboarding.petOptions.cat" },
  { value: "Hamster", key: "onboarding.petOptions.hamster" },
  { value: "Bird", key: "onboarding.petOptions.bird" },
  { value: "Fish", key: "onboarding.petOptions.fish" },
];

// "140 cm" … "200 cm"
export const HEIGHT_OPTIONS = Array.from(
  { length: 61 },
  (_, idx) => `${140 + idx} cm`
);

export const parseListField = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const sortOptionsByLabel = (options) =>
  [...options].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );

const translate = (t, list) =>
  list.map(({ value, key }) => ({ value, label: t(key) }));

const translateCountries = (t, list) =>
  list.map(({ value, key, cities }) => ({
    value,
    label: t(key),
    cities: sortOptionsByLabel(translate(t, cities)),
  }));

const toLabelMap = (options) =>
  options.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {});

// Translated option lists. Gender has no placeholder entry; pages that need
// one prepend it themselves.
export const useProfileOptions = () => {
  const { t } = useTranslation();
  return useMemo(() => {
    const hobbyOptions = translate(t, HOBBY_VALUES);
    const petOptions = translate(t, PET_VALUES);
    return {
      genderOptions: translate(t, GENDER_VALUES),
      countryCityOptions: translateCountries(t, COUNTRIES),
      birthCountryOptions: translateCountries(t, BIRTH_COUNTRIES),
      educationOptions: translate(t, EDUCATION_VALUES),
      hobbyOptions,
      petOptions,
      hobbyLabelMap: toLabelMap(hobbyOptions),
      petLabelMap: toLabelMap(petOptions),
      heightOptions: HEIGHT_OPTIONS,
    };
  }, [t]);
};
