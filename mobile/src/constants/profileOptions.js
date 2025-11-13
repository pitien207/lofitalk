export const REQUIRED_FIELDS = ["fullName", "gender", "birthDate", "country", "city"];

export const genderOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_say", label: "Prefer not say" },
];

export const countryCityOptions = [
  {
    value: "Vietnam",
    label: "Vietnam",
    cities: ["Hanoi", "Ho Chi Minh City", "Da Nang"],
  },
  {
    value: "Germany",
    label: "Germany",
    cities: ["Berlin", "Munich", "Hamburg"],
  },
  {
    value: "Japan",
    label: "Japan",
    cities: ["Tokyo", "Osaka", "Kyoto"],
  },
  {
    value: "Australia",
    label: "Australia",
    cities: ["Sydney", "Melbourne", "Brisbane"],
  },
];

export const educationOptions = [
  "High school graduate",
  "University",
  "Vocational training",
  "Working professional",
];

export const hobbyOptions = [
  "Music",
  "Reading",
  "Sports",
  "Cooking",
  "Travel",
  "Movies",
  "Gaming",
  "Yoga",
  "Design",
];

export const petOptions = ["Dog", "Cat", "Bird", "Fish", "Hamster", "Other"];
