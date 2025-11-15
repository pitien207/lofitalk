export const REQUIRED_FIELDS = ["fullName", "gender", "birthDate", "country", "city"];

export const genderOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

export const countryCityOptions = [
  {
    value: "Vietnam",
    label: "Vietnam",
    cities: [
      "Da Nang",
      "Hai Phong",
      "Hanoi",
      "Ho Chi Minh City",
      "Hue",
      "Nghe An",
      "Ninh Binh",
      "Thanh Hoa",
    ],
  },
  {
    value: "Germany",
    label: "Germany",
    cities: [
      "Berlin",
      "Bremen",
      "Cologne",
      "Dresden",
      "Frankfurt",
      "Hamburg",
      "Leipzig",
      "Munich",
      "Nuremberg",
      "Stuttgart",
    ],
  },
  {
    value: "Japan",
    label: "Japan",
    cities: [
      "Fukuoka",
      "Hiroshima",
      "Kobe",
      "Kyoto",
      "Nagoya",
      "Osaka",
      "Sapporo",
      "Sendai",
      "Tokyo",
      "Yokohama",
    ],
  },
  {
    value: "Australia",
    label: "Australia",
    cities: [
      "Adelaide",
      "Brisbane",
      "Canberra",
      "Gold Coast",
      "Melbourne",
      "Perth",
      "Sydney",
    ],
  },
];

export const educationOptions = [
  "High school graduate",
  "University",
  "Vocational training",
  "Working professional",
];

export const hobbyOptions = [
  "Music & concerts",
  "Traveling",
  "Cooking & baking",
  "Video games",
  "Reading",
  "Fitness & gym",
  "Photography",
  "Art & design",
  "Movies & series",
  "Hiking & outdoors",
];

export const petOptions = ["Dog", "Cat", "Hamster", "Bird", "Fish"];
