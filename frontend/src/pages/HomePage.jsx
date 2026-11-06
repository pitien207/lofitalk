import { useEffect, useMemo, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding, updatePassword } from "../lib/api";
import { useTranslation } from "../languages/useTranslation";
import {
  CameraIcon,
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
  ShuffleIcon,
  CalendarIcon,
  HeartIcon,
  BookOpenIcon,
  QuoteIcon,
  PawPrintIcon,
  SparklesIcon,
} from "lucide-react";
import { getCountryFlag } from "../utils/flags";
import { getRandomAvatar } from "../utils/avatarPool";
import { parseListField, useProfileOptions } from "../constants/profileOptions";
import AvatarUploader from "../components/AvatarUploader";
import DeleteAccountSection from "../components/DeleteAccountSection";
import PushNotificationsToggle from "../components/PushNotificationsToggle";
import PasswordInput from "../components/PasswordInput";
import PasswordStrength from "../components/PasswordStrength";

const InfoBadge = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl border border-base-300 bg-base-100">
      <div className="mt-0.5">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-xs uppercase opacity-60 tracking-wide">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  );
};

const HomePage = () => {
  const { authUser, isLoading } = useAuthUser();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [formState, setFormState] = useState({
    fullName: "",
    bio: "",
    gender: "",
    birthDate: "",
    country: "",
    city: "",
    birthCountry: "",
    birthCity: "",
    height: "",
    education: "",
    hobbies: [],
    pets: [],
    favoritePerfume: "",
    profilePic: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!authUser) return;
    const parsedBirthDate = authUser.birthDate
      ? new Date(authUser.birthDate)
      : null;
    setFormState({
      fullName: authUser.fullName || "",
      bio: authUser.bio || "",
      gender: authUser.gender || "",
      birthDate:
        parsedBirthDate && !Number.isNaN(parsedBirthDate.getTime())
          ? parsedBirthDate.toISOString().slice(0, 10)
          : "",
      country: authUser.country || "",
      city: authUser.city || "",
      birthCountry: authUser.birthCountry || "",
      birthCity: authUser.birthCity || "",
      height: authUser.height || "",
      education: authUser.education || "",
      hobbies: parseListField(authUser.hobbies),
      pets: parseListField(authUser.pets),
      favoritePerfume: authUser.favoritePerfume || "",
      profilePic: authUser.profilePic || "",
    });
  }, [authUser]);

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

  const genderOptions = useMemo(
    () => [
      { value: "", label: t("onboarding.genderPlaceholder") },
      ...baseGenderOptions,
    ],
    [t, baseGenderOptions]
  );

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
      countryCityOptions.find((country) => country.value === value)?.cities ||
      [];
    setFormState((prev) => ({
      ...prev,
      country: value,
      city: allowedCities.some((city) => city.value === prev.city)
        ? prev.city
        : "",
    }));
  };

  const handleBirthCountryChange = (value) => {
    const allowedCities =
      birthCountryOptions.find((country) => country.value === value)?.cities ||
      [];
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

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success(t("profile.updated"));
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const { mutate: changePassword, isPending: isUpdatingPassword } = useMutation(
    {
      mutationFn: updatePassword,
      onSuccess: () => {
        toast.success(t("profile.passwordSuccess"));
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || t("profile.passwordError")
        );
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    saveProfile({
      ...formState,
      hobbies: formState.hobbies.join(", "),
      pets: formState.pets.join(", "),
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }
    changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
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

  const age = authUser?.birthDate
    ? Math.max(
        18,
        new Date(Date.now() - new Date(authUser.birthDate)).getUTCFullYear() -
          1970
      )
    : null;
  const homeFlag = getCountryFlag(formState.country, formState.city);
  const birthPlaceValue = [formState.birthCity, formState.birthCountry]
    .filter(Boolean)
    .join(", ");

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: PROFILE SUMMARY */}
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body space-y-4">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="avatar">
                  <div className="w-32 h-32 rounded-2xl ring ring-primary/40 ring-offset-2">
                    <img src={formState.profilePic} alt={formState.fullName} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{formState.fullName}</h1>
                  <div className="flex items-center justify-center gap-2 text-base-content/70 mt-1">
                    {homeFlag ? (
                      <div className="w-7 h-4 overflow-hidden rounded-[5px] border border-base-200 shadow ring-1 ring-primary/30 ring-offset-2 ring-offset-base-100">
                        <img
                          src={homeFlag}
                          alt={formState.country}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <MapPinIcon className="size-4" />
                    )}
                    <span>
                      {[formState.city, formState.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  {age && (
                    <span className="badge badge-primary badge-outline mt-2">
                      {age} {t("profile.yearsOld")}
                    </span>
                  )}
                </div>
                {formState.bio && (
                  <p className="text-base-content/80 italic">
                    “{formState.bio}”
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <InfoBadge
              icon={CalendarIcon}
              label={t("profile.birthDate")}
              value={
                formState.birthDate
                  ? new Date(formState.birthDate).toLocaleDateString()
                  : null
              }
            />
            <InfoBadge
              icon={MapPinIcon}
              label={t("profile.birthPlace")}
              value={birthPlaceValue}
            />
            <InfoBadge
              icon={BookOpenIcon}
              label={t("profile.education")}
              value={formState.education}
            />
            <InfoBadge
              icon={QuoteIcon}
              label={t("profile.hobbies")}
              value={
                formState.hobbies.length
                  ? formatSelected(formState.hobbies, hobbyLabelMap)
                  : ""
              }
            />
            <InfoBadge
              icon={PawPrintIcon}
              label={t("profile.pets")}
              value={
                formState.pets.length
                  ? formatSelected(formState.pets, petLabelMap)
                  : ""
              }
            />
            <InfoBadge
              icon={SparklesIcon}
              label={t("profile.favoritePerfume")}
              value={formState.favoritePerfume}
            />
            <InfoBadge
              icon={HeartIcon}
              label={t("profile.height")}
              value={formState.height}
            />
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="font-semibold text-lg">
                {t("profile.connections", {
                  count: authUser?.friends?.length || 0,
                })}
              </h2>
              <p className="text-sm opacity-70">
                {t("profile.connectionHint")}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: EDIT FORM */}
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body space-y-5">
              <div>
                <h2 className="text-2xl font-semibold">
                  {t("profile.editTitle")}
                </h2>
                <p className="text-sm opacity-70">
                  {t("profile.editSubtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="btn btn-accent btn-sm"
                  >
                    <ShuffleIcon className="size-4 mr-1.5" />
                    {t("onboarding.randomAvatar")}
                  </button>
                  <AvatarUploader
                    onUploaded={(url) => updateFormField("profilePic", url)}
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="home-full-name">
                    <span className="label-text">
                      {t("onboarding.fullName")}
                    </span>
                  </label>
                  <input id="home-full-name"
                    type="text"
                    value={formState.fullName}
                    onChange={(e) =>
                      updateFormField("fullName", e.target.value)
                    }
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="home-bio">
                    <span className="label-text">{t("onboarding.bio")}</span>
                  </label>
                  <textarea id="home-bio"
                    maxLength={1000}
                    value={formState.bio}
                    onChange={(e) => updateFormField("bio", e.target.value)}
                    className="textarea textarea-bordered h-24"
                    placeholder={t("onboarding.bioPlaceholder")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="home-gender">
                      <span className="label-text">
                        {t("onboarding.gender")}
                      </span>
                    </label>
                    <select id="home-gender"
                      value={formState.gender}
                      className={selectBaseClass}
                      onChange={(e) =>
                        updateFormField("gender", e.target.value)
                      }
                    >
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label" htmlFor="home-birth-date">
                      <span className="label-text">
                        {t("onboarding.birthDate")}
                      </span>
                    </label>
                    <input id="home-birth-date"
                      type="date"
                      value={formState.birthDate}
                      onChange={(e) =>
                        updateFormField("birthDate", e.target.value)
                      }
                      className="input input-bordered w-full"
                      max={new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label" htmlFor="home-birth-country">
                        <span className="label-text">
                          {t("onboarding.birthCountryLabel")}
                        </span>
                      </label>
                      <select id="home-birth-country"
                        value={formState.birthCountry}
                        onChange={(e) =>
                          handleBirthCountryChange(e.target.value)
                        }
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
                      <label className="label" htmlFor="home-birth-city">
                        <span className="label-text">
                          {t("onboarding.birthCityLabel")}
                        </span>
                      </label>
                      <select id="home-birth-city"
                        value={formState.birthCity}
                        onChange={(e) =>
                          updateFormField("birthCity", e.target.value)
                        }
                        className={`${selectBaseClass} ${
                          !availableBirthCities.length && !hasCustomBirthCity
                            ? "opacity-60"
                            : ""
                        }`}
                        disabled={
                          !availableBirthCities.length && !hasCustomBirthCity
                        }
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
                    <label className="label" htmlFor="home-country">
                      <span className="label-text">
                        {t("onboarding.country")}
                      </span>
                    </label>
                    <select id="home-country"
                      value={formState.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className={selectBaseClass}
                      required
                    >
                      <option value="">
                        {t("onboarding.countryPlaceholder")}
                      </option>
                      {hasCustomCountry && (
                        <option value={formState.country}>
                          {formState.country}
                        </option>
                      )}
                      {countryCityOptions.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label" htmlFor="home-city">
                      <span className="label-text">{t("onboarding.city")}</span>
                    </label>
                    <select id="home-city"
                      value={formState.city}
                      onChange={(e) => updateFormField("city", e.target.value)}
                      className={`${selectBaseClass} ${
                        !availableCities.length && !hasCustomCity
                          ? "opacity-60"
                          : ""
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
                    <label className="label" htmlFor="home-height">
                      <span className="label-text">
                        {t("onboarding.height")}{" "}
                        <span className="text-xs opacity-60">
                          ({t("onboarding.optional")})
                        </span>
                      </span>
                    </label>
                    <select id="home-height"
                      value={formState.height}
                      onChange={(e) =>
                        updateFormField("height", e.target.value)
                      }
                      className={selectBaseClass}
                    >
                      <option value="">
                        {t("onboarding.heightPlaceholder")}
                      </option>
                      {hasCustomHeight && (
                        <option value={formState.height}>
                          {formState.height}
                        </option>
                      )}
                      {heightOptions.map((height) => (
                        <option key={height} value={height}>
                          {height}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label" htmlFor="home-education">
                      <span className="label-text">
                        {t("onboarding.education")}{" "}
                        <span className="text-xs opacity-60">
                          ({t("onboarding.optional")})
                        </span>
                      </span>
                    </label>
                    <select id="home-education"
                      value={formState.education}
                      onChange={(e) =>
                        updateFormField("education", e.target.value)
                      }
                      className={selectBaseClass}
                    >
                      <option value="">
                        {t("onboarding.educationPlaceholder")}
                      </option>
                      {hasCustomEducation && (
                        <option value={formState.education}>
                          {formState.education}
                        </option>
                      )}
                      {educationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
                            onChange={() =>
                              toggleMultiSelect("hobbies", option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {formState.hobbies.length > 0 && (
                    <p className="text-xs opacity-70 mt-2">
                      {t("onboarding.selectedLabel", {
                        items: formState.hobbies.join(", "),
                      })}
                    </p>
                  )}
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
                            onChange={() =>
                              toggleMultiSelect("pets", option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                </div>
                {formState.pets.length > 0 && (
                  <p className="text-xs opacity-70 mt-2">
                    {t("onboarding.selectedLabel", {
                      items: formState.pets.join(", "),
                    })}
                  </p>
                )}
              </div>

              <div className="form-control">
                <label className="label" htmlFor="home-favorite-perfume">
                  <span className="label-text">
                    {t("onboarding.favoritePerfume")}{" "}
                    <span className="text-xs opacity-60">
                      ({t("onboarding.optional")})
                    </span>
                  </span>
                </label>
                <input id="home-favorite-perfume"
                  type="text"
                  value={formState.favoritePerfume}
                  onChange={(e) =>
                    updateFormField("favoritePerfume", e.target.value)
                  }
                  className="input input-bordered w-full"
                  placeholder={t("onboarding.favoritePerfumePlaceholder")}
                />
              </div>

              <button
                className="btn btn-primary w-full"
                  disabled={isPending}
                  type="submit"
                >
                  {!isPending ? (
                    <>
                      <ShipWheelIcon className="size-5 mr-2" />
                      {t("profile.saveButton")}
                    </>
                  ) : (
                    <>
                      <LoaderIcon className="animate-spin size-5 mr-2" />
                      {t("profile.saving")}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="card bg-base-200 shadow">
            <div className="card-body space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {t("profile.passwordTitle")}
                </h2>
                <p className="text-sm opacity-70">
                  {t("profile.passwordSubtitle")}
                </p>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="form-control">
                  <label className="label" htmlFor="home-current-password">
                    <span className="label-text">
                      {t("profile.passwordCurrent")}
                    </span>
                  </label>
                  <PasswordInput id="home-current-password"
                    className="input input-bordered"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="home-new-password">
                    <span className="label-text">
                      {t("profile.passwordNew")}
                    </span>
                  </label>
                  <PasswordInput id="home-new-password"
                    className="input input-bordered"
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                  />
                  <PasswordStrength password={passwordForm.newPassword} />
                  <p className="text-xs opacity-60 mt-1">
                    {t("profile.passwordHint")}
                  </p>
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="home-confirm-password">
                    <span className="label-text">
                      {t("profile.passwordConfirm")}
                    </span>
                  </label>
                  <PasswordInput id="home-confirm-password"
                    className="input input-bordered"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-outline w-full"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <>
                      <LoaderIcon className="size-4 mr-2 animate-spin" />
                      {t("profile.passwordSaving")}
                    </>
                  ) : (
                    t("profile.passwordSubmit")
                  )}
                </button>
              </form>
            </div>
          </div>

          <PushNotificationsToggle />
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
