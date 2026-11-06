import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { useTranslation } from "../languages/useTranslation";
import {
  CameraIcon,
  LoaderIcon,
  ShipWheelIcon,
  ShuffleIcon,
} from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import AvatarUploader from "../components/AvatarUploader";
import { getRandomAvatar } from "../utils/avatarPool";
import { parseListField, useProfileOptions } from "../constants/profileOptions";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const parsedBirthDate = authUser?.birthDate
    ? new Date(authUser.birthDate)
    : null;
  const initialBirthDate =
    parsedBirthDate && !Number.isNaN(parsedBirthDate.getTime())
      ? parsedBirthDate.toISOString().slice(0, 10)
      : "";
  const initialHobbies = parseListField(authUser?.hobbies);
  const initialPets = parseListField(authUser?.pets);

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    gender: authUser?.gender || "",
    birthDate: initialBirthDate,
    country: authUser?.country || "",
    city: authUser?.city || "",
    birthCountry: authUser?.birthCountry || "",
    birthCity: authUser?.birthCity || "",
    height: authUser?.height || "",
    education: authUser?.education || "",
    hobbies: initialHobbies,
    pets: initialPets,
    favoritePerfume: authUser?.favoritePerfume || "",
    profilePic: authUser?.profilePic || "",
  });

  const {
    genderOptions: baseGenderOptions,
    countryCityOptions,
    birthCountryOptions,
    educationOptions,
    hobbyOptions,
    petOptions,
    hobbyLabelMap,
    petLabelMap,
    heightOptions,
  } = useProfileOptions();

  const GENDER_OPTIONS = [
    { value: "", label: t("onboarding.genderPlaceholder") },
    ...baseGenderOptions,
  ];

  const selectedCountry = countryCityOptions.find(
    (country) => country.value === formState.country
  );
  const availableCities = selectedCountry?.cities || [];
  const hasCustomCountry =
    formState.country &&
    !countryCityOptions.some((country) => country.value === formState.country);
  const hasCustomCity =
    formState.city &&
    !availableCities.some((city) => city.value === formState.city);
  const selectedBirthCountry = birthCountryOptions.find(
    (country) => country.value === formState.birthCountry
  );
  const availableBirthCities = selectedBirthCountry?.cities || [];
  const hasCustomBirthCountry =
    formState.birthCountry &&
    !birthCountryOptions.some(
      (country) => country.value === formState.birthCountry
    );
  const hasCustomBirthCity =
    formState.birthCity &&
    !availableBirthCities.some((city) => city.value === formState.birthCity);
  const hasCustomHeight =
    formState.height && !heightOptions.includes(formState.height);
  const hasCustomEducation =
    formState.education &&
    !educationOptions.some((option) => option.value === formState.education);

  const updateFormField = (field, value) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const handleCountryChange = (value) => {
    const allowedCities =
      countryCityOptions.find((country) => country.value === value)?.cities || [];
    setFormState((prev) => ({
      ...prev,
      country: value,
      city: allowedCities.some((city) => city.value === prev.city) ? prev.city : "",
    }));
  };

  const handleBirthCountryChange = (value) => {
    const allowedCities =
      birthCountryOptions.find((country) => country.value === value)?.cities || [];
    setFormState((prev) => ({
      ...prev,
      birthCountry: value,
      birthCity: allowedCities.some((city) => city.value === prev.birthCity)
        ? prev.birthCity
        : "",
    }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormState((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const exists = current.includes(value);
      const updated = exists
        ? current.filter((item) => item !== value)
        : [...current, value];
      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  const formatSelected = (values, labelMap) =>
    values
      .map((item) => labelMap[item] || item)
      .filter(Boolean)
      .join(", ");

  const selectBaseClass =
    "select select-bordered lofitalk-select w-full bg-base-100 border-base-300 focus:outline-none focus:border-primary/70 focus:ring focus:ring-primary/20 transition";

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    onboardingMutation({
      ...formState,
      hobbies: formState.hobbies.join(", "),
      pets: formState.pets.join(", "),
    });
  };

  const handleRandomAvatar = async () => {
    const genderForAvatar = formState.gender || authUser?.gender || "";
    const randomAvatar = await getRandomAvatar(genderForAvatar);

    if (!randomAvatar) {
      toast.error("Không tìm thấy avatar phù hợp.");
      return;
    }

    updateFormField("profilePic", randomAvatar);
    toast.success(t("language.randomAvatarToast"));
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-center flex-grow">
              {t("onboarding.title")}
            </h1>
            <LanguageSelector />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROFILE PIC CONTAINER */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* IMAGE PREVIEW */}
              <div className="size-32 rounded-full bg-base-300 overflow-hidden">
                {formState.profilePic ? (
                  <img
                    src={formState.profilePic}
                    alt={t("onboarding.profilePlaceholder")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CameraIcon className="size-12 text-base-content opacity-40" />
                  </div>
                )}
              </div>

              {/* Generate Random Avatar BTN */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="btn btn-accent"
                  >
                    <ShuffleIcon className="size-4 mr-2" />
                    {t("onboarding.randomAvatar")}
                  </button>
                  <AvatarUploader
                    buttonClassName="btn btn-outline"
                    onUploaded={(url) => updateFormField("profilePic", url)}
                  />
                </div>
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label" htmlFor="onboarding-full-name">
                <span className="label-text">{t("onboarding.fullName")}</span>
              </label>
              <input id="onboarding-full-name"
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) => updateFormField("fullName", e.target.value)}
                className="input input-bordered w-full"
                placeholder="Your full name"
              />
            </div>

            {/* BIO */}
            <div className="form-control">
              <label className="label" htmlFor="onboarding-bio">
                <span className="label-text">{t("onboarding.bio")}</span>
              </label>
              <textarea id="onboarding-bio"
                name="bio"
                maxLength={1000}
                value={formState.bio}
                onChange={(e) => updateFormField("bio", e.target.value)}
                className="textarea textarea-bordered h-24"
                placeholder={t("onboarding.bioPlaceholder")}
              />
            </div>

            {/* CORE INFO */}
            <div className="grid grid-cols-1 gap-4">
              <div className="form-control">
                <label className="label" htmlFor="onboarding-gender">
                  <span className="label-text">
                    {t("onboarding.gender")}
                  </span>
                </label>
                <select id="onboarding-gender"
                  name="gender"
                  value={formState.gender}
                  onChange={(e) => updateFormField("gender", e.target.value)}
                  className={selectBaseClass}
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="onboarding-birth-date">
                  <span className="label-text">{t("onboarding.birthDate")}</span>
                </label>
              <input id="onboarding-birth-date"
                type="date"
                name="birthDate"
                value={formState.birthDate}
                onChange={(e) => updateFormField("birthDate", e.target.value)}
                className="input input-bordered w-full"
                max={new Date().toISOString().slice(0, 10)}
                required
                />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">
              {t("onboarding.birthPlaceTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label" htmlFor="onboarding-birth-country">
                  <span className="label-text">
                    {t("onboarding.birthCountryLabel")}
                  </span>
                </label>
                <select id="onboarding-birth-country"
                  name="birthCountry"
                  value={formState.birthCountry}
                  onChange={(e) => handleBirthCountryChange(e.target.value)}
                  className={selectBaseClass}
                >
                  <option value="">
                    {t("onboarding.birthCountryPlaceholder")}
                  </option>
                  {hasCustomBirthCountry && (
                    <option value={formState.birthCountry}>
                      {formState.birthCountry}
                    </option>
                  )}
                  {birthCountryOptions.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label" htmlFor="onboarding-birth-city">
                  <span className="label-text">
                    {t("onboarding.birthCityLabel")}
                  </span>
                </label>
                <select id="onboarding-birth-city"
                  name="birthCity"
                  value={formState.birthCity}
                  onChange={(e) => updateFormField("birthCity", e.target.value)}
                  className={`${selectBaseClass} ${
                    !availableBirthCities.length && !hasCustomBirthCity
                      ? "opacity-60"
                      : ""
                  }`}
                  disabled={!availableBirthCities.length && !hasCustomBirthCity}
                >
                  <option value="">
                    {formState.birthCountry
                      ? t("onboarding.birthCityPlaceholder")
                      : t("onboarding.cityDisabledPlaceholder")}
                  </option>
                  {hasCustomBirthCity && (
                    <option value={formState.birthCity}>
                      {formState.birthCity}
                    </option>
                  )}
                  {availableBirthCities.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="onboarding-country">
                  <span className="label-text">{t("onboarding.country")}</span>
                </label>
                <select id="onboarding-country"
                  name="country"
                  value={formState.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={selectBaseClass}
                  required
                >
                  <option value="">{t("onboarding.countryPlaceholder")}</option>
                  {hasCustomCountry && (
                    <option value={formState.country}>{formState.country}</option>
                  )}
                  {countryCityOptions.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label" htmlFor="onboarding-city">
                  <span className="label-text">{t("onboarding.city")}</span>
                </label>
                <select id="onboarding-city"
                  name="city"
                  value={formState.city}
                  onChange={(e) => updateFormField("city", e.target.value)}
                  className={`${selectBaseClass} ${
                    !availableCities.length && !hasCustomCity ? "opacity-60" : ""
                  }`}
                  disabled={!availableCities.length && !hasCustomCity}
                  required
                >
                  <option value="">
                    {formState.country
                      ? t("onboarding.cityPlaceholder")
                      : t("onboarding.cityDisabledPlaceholder")}
                  </option>
                  {hasCustomCity && (
                    <option value={formState.city}>{formState.city}</option>
                  )}
                  {availableCities.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label" htmlFor="onboarding-height">
                  <span className="label-text">
                    {t("onboarding.height")}{" "}
                    <span className="text-xs opacity-60">
                      ({t("onboarding.optional")})
                    </span>
                  </span>
                </label>
                <select id="onboarding-height"
                  name="height"
                  value={formState.height}
                  onChange={(e) => updateFormField("height", e.target.value)}
                  className={selectBaseClass}
                >
                  <option value="">{t("onboarding.heightPlaceholder")}</option>
                  {hasCustomHeight && (
                    <option value={formState.height}>{formState.height}</option>
                  )}
                  {heightOptions.map((height) => (
                    <option key={height} value={height}>
                      {height}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label" htmlFor="onboarding-education">
                  <span className="label-text">
                    {t("onboarding.education")}{" "}
                    <span className="text-xs opacity-60">
                      ({t("onboarding.optional")})
                    </span>
                  </span>
                </label>
                <select id="onboarding-education"
                  name="education"
                  value={formState.education}
                  onChange={(e) => updateFormField("education", e.target.value)}
                  className={selectBaseClass}
                >
                  <option value="">{t("onboarding.educationPlaceholder")}</option>
                  {hasCustomEducation && (
                    <option value={formState.education}>{formState.education}</option>
                  )}
                  {educationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("onboarding.hobbies")}{" "}
                    <span className="text-xs opacity-60">
                      ({t("onboarding.optional")})
                    </span>
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {hobbyOptions.map((option) => {
                    const selected = formState.hobbies.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-base-content/20 bg-base-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selected}
                          onChange={() => toggleMultiSelect("hobbies", option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                {formState.hobbies.length > 0 && (
                  <p className="text-xs opacity-70 mt-2">
                    {t("onboarding.selectedLabel", {
                      items: formatSelected(formState.hobbies, hobbyLabelMap),
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("onboarding.pets")}{" "}
                  <span className="text-xs opacity-60">
                    ({t("onboarding.optional")})
                  </span>
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {petOptions.map((option) => {
                  const selected = formState.pets.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                        selected
                          ? "border-secondary bg-secondary/10"
                          : "border-base-content/20 bg-base-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selected}
                        onChange={() => toggleMultiSelect("pets", option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {formState.pets.length > 0 && (
                <p className="text-xs opacity-70 mt-2">
                  {t("onboarding.selectedLabel", {
                    items: formatSelected(formState.pets, petLabelMap),
                  })}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="onboarding-favorite-perfume">
                <span className="label-text">
                  {t("onboarding.favoritePerfume")}{" "}
                  <span className="text-xs opacity-60">
                    ({t("onboarding.optional")})
                  </span>
                </span>
              </label>
              <input id="onboarding-favorite-perfume"
                type="text"
                name="favoritePerfume"
                value={formState.favoritePerfume}
                onChange={(e) => updateFormField("favoritePerfume", e.target.value)}
                className="input input-bordered w-full"
                placeholder={t("onboarding.favoritePerfumePlaceholder")}
              />
            </div>

            {/* SUBMIT BUTTON */}

            <button
              className="btn btn-primary w-full"
              disabled={isPending}
              type="submit"
            >
              {!isPending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  {t("onboarding.completeButton")}
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  {t("onboarding.completing")}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default OnboardingPage;
