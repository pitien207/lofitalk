import { useEffect, useMemo, useRef, useState } from "react";
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
  UploadIcon,
  CalendarIcon,
  HeartIcon,
  BookOpenIcon,
  QuoteIcon,
  PawPrintIcon,
} from "lucide-react";
import { getCountryFlag } from "../utils/flags";
import { getRandomAvatar } from "../utils/avatarPool";

const parseListField = (value) =>
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
  const fileInputRef = useRef(null);
  const canUploadAvatar = authUser?.accountType === "admin";

  const [formState, setFormState] = useState({
    fullName: "",
    bio: "",
    gender: "",
    birthDate: "",
    country: "",
    city: "",
    height: "",
    education: "",
    hobbies: [],
    pets: [],
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
      height: authUser.height || "",
      education: authUser.education || "",
      hobbies: parseListField(authUser.hobbies),
      pets: parseListField(authUser.pets),
      profilePic: authUser.profilePic || "",
    });
  }, [authUser]);

  const genderOptions = useMemo(
    () => [
      { value: "", label: t("onboarding.genderPlaceholder") },
      { value: "female", label: t("onboarding.genderOptions.female") },
      { value: "male", label: t("onboarding.genderOptions.male") },
      { value: "non-binary", label: t("onboarding.genderOptions.nonBinary") },
      {
        value: "prefer_not_say",
        label: t("onboarding.genderOptions.preferNotSay"),
      },
    ],
    [t]
  );

  const countryCityOptions = useMemo(
    () => [
      {
        value: "Vietnam",
        label: t("onboarding.countryOptions.vietnam"),
        cities: sortOptionsByLabel([
          { value: "Can Tho", label: t("onboarding.cityOptions.vietnam.cantho") },
          { value: "Da Lat", label: t("onboarding.cityOptions.vietnam.dalat") },
          { value: "Da Nang", label: t("onboarding.cityOptions.vietnam.danang") },
          {
            value: "Hai Phong",
            label: t("onboarding.cityOptions.vietnam.haiphong"),
          },
          { value: "Hanoi", label: t("onboarding.cityOptions.vietnam.hanoi") },
          {
            value: "Ho Chi Minh City",
            label: t("onboarding.cityOptions.vietnam.hcmc"),
          },
          { value: "Hue", label: t("onboarding.cityOptions.vietnam.hue") },
          { value: "Nam Dinh", label: t("onboarding.cityOptions.vietnam.namdinh") },
          { value: "Nghe An", label: t("onboarding.cityOptions.vietnam.nghean") },
          {
            value: "Ninh Binh",
            label: t("onboarding.cityOptions.vietnam.ninhbinh"),
          },
          { value: "Quy Nhon", label: t("onboarding.cityOptions.vietnam.quynhon") },
          {
            value: "Thanh Hoa",
            label: t("onboarding.cityOptions.vietnam.thanhhoa"),
          },
          { value: "Vinh", label: t("onboarding.cityOptions.vietnam.vinh") },
          { value: "Vung Tau", label: t("onboarding.cityOptions.vietnam.vungtau") },
        ]),
      },
      {
        value: "Germany",
        label: t("onboarding.countryOptions.germany"),
        cities: sortOptionsByLabel([
          { value: "Berlin", label: t("onboarding.cityOptions.germany.berlin") },
          { value: "Bonn", label: t("onboarding.cityOptions.germany.bonn") },
          { value: "Bremen", label: t("onboarding.cityOptions.germany.bremen") },
          { value: "Cologne", label: t("onboarding.cityOptions.germany.koln") },
          {
            value: "Dresden",
            label: t("onboarding.cityOptions.germany.dresden"),
          },
          {
            value: "Dusseldorf",
            label: t("onboarding.cityOptions.germany.dusseldorf"),
          },
          {
            value: "Frankfurt",
            label: t("onboarding.cityOptions.germany.frankfurt"),
          },
          {
            value: "Hanover",
            label: t("onboarding.cityOptions.germany.hanover"),
          },
          {
            value: "Hamburg",
            label: t("onboarding.cityOptions.germany.hamburg"),
          },
          { value: "Leipzig", label: t("onboarding.cityOptions.germany.leipzig") },
          { value: "Munich", label: t("onboarding.cityOptions.germany.munich") },
          {
            value: "Nuremberg",
            label: t("onboarding.cityOptions.germany.nurnberg"),
          },
          {
            value: "Stuttgart",
            label: t("onboarding.cityOptions.germany.stuttgart"),
          },
          { value: "Essen", label: t("onboarding.cityOptions.germany.essen") },
          { value: "Dortmund", label: t("onboarding.cityOptions.germany.dortmund") },
          { value: "Bochum", label: t("onboarding.cityOptions.germany.bochum") },
          { value: "Karlsruhe", label: t("onboarding.cityOptions.germany.karlsruhe") },
          { value: "Aachen", label: t("onboarding.cityOptions.germany.aachen") },
          { value: "Freiburg", label: t("onboarding.cityOptions.germany.freiburg") },
          { value: "Regensburg", label: t("onboarding.cityOptions.germany.regensburg") },
        ]),
      },
      {
        value: "Japan",
        label: t("onboarding.countryOptions.japan"),
        cities: sortOptionsByLabel([
          { value: "Fukuoka", label: t("onboarding.cityOptions.japan.fukuoka") },
          {
            value: "Hiroshima",
            label: t("onboarding.cityOptions.japan.hiroshima"),
          },
          { value: "Kobe", label: t("onboarding.cityOptions.japan.kobe") },
          { value: "Kyoto", label: t("onboarding.cityOptions.japan.kyoto") },
          { value: "Nagoya", label: t("onboarding.cityOptions.japan.nagoya") },
          { value: "Osaka", label: t("onboarding.cityOptions.japan.osaka") },
          {
            value: "Sapporo",
            label: t("onboarding.cityOptions.japan.sapporo"),
          },
          { value: "Sendai", label: t("onboarding.cityOptions.japan.sendai") },
          { value: "Tokyo", label: t("onboarding.cityOptions.japan.tokyo") },
          {
            value: "Yokohama",
            label: t("onboarding.cityOptions.japan.yokohama"),
          },
        ]),
      },
      {
        value: "Australia",
        label: t("onboarding.countryOptions.australia"),
        cities: sortOptionsByLabel([
          {
            value: "Adelaide",
            label: t("onboarding.cityOptions.australia.adelaide"),
          },
          {
            value: "Brisbane",
            label: t("onboarding.cityOptions.australia.brisbane"),
          },
          {
            value: "Canberra",
            label: t("onboarding.cityOptions.australia.canberra"),
          },
          {
            value: "Gold Coast",
            label: t("onboarding.cityOptions.australia.goldcoast"),
          },
          {
            value: "Melbourne",
            label: t("onboarding.cityOptions.australia.melbourne"),
          },
          { value: "Perth", label: t("onboarding.cityOptions.australia.perth") },
          { value: "Sydney", label: t("onboarding.cityOptions.australia.sydney") },
        ]),
      },
    ],
    [t]
  );

  const educationOptions = useMemo(
    () => [
      {
        value: "High school graduate",
        label: t("onboarding.educationOptions.highSchool"),
      },
      { value: "University", label: t("onboarding.educationOptions.university") },
      {
        value: "Vocational training",
        label: t("onboarding.educationOptions.vocational"),
      },
      {
        value: "Working professional",
        label: t("onboarding.educationOptions.working"),
      },
    ],
    [t]
  );

  const hobbyOptions = useMemo(
    () => [
      { value: "Music & concerts", label: t("onboarding.hobbyOptions.music") },
      { value: "Traveling", label: t("onboarding.hobbyOptions.travel") },
      { value: "Cooking & baking", label: t("onboarding.hobbyOptions.cooking") },
      { value: "Video games", label: t("onboarding.hobbyOptions.gaming") },
      { value: "Reading", label: t("onboarding.hobbyOptions.reading") },
      { value: "Fitness & gym", label: t("onboarding.hobbyOptions.fitness") },
      { value: "Photography", label: t("onboarding.hobbyOptions.photography") },
      { value: "Art & design", label: t("onboarding.hobbyOptions.art") },
      { value: "Movies & series", label: t("onboarding.hobbyOptions.movies") },
      { value: "Hiking & outdoors", label: t("onboarding.hobbyOptions.outdoors") },
    ],
    [t]
  );

  const petOptions = useMemo(
    () => [
      { value: "Dog", label: t("onboarding.petOptions.dog") },
      { value: "Cat", label: t("onboarding.petOptions.cat") },
      { value: "Hamster", label: t("onboarding.petOptions.hamster") },
      { value: "Bird", label: t("onboarding.petOptions.bird") },
      { value: "Fish", label: t("onboarding.petOptions.fish") },
    ],
    [t]
  );

  const heightOptions = useMemo(
    () => Array.from({ length: 61 }, (_, idx) => `${140 + idx} cm`),
    []
  );

  const hobbyLabelMap = useMemo(
    () =>
      hobbyOptions.reduce((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {}),
    [hobbyOptions]
  );

  const petLabelMap = useMemo(
    () =>
      petOptions.reduce((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {}),
    [petOptions]
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

  const {
    mutate: changePassword,
    isPending: isUpdatingPassword,
  } = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success(t("profile.passwordSuccess"));
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("profile.passwordError")
      );
    },
  });

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

  const handleRandomAvatar = () => {
    const genderForAvatar = formState.gender || authUser?.gender || "";
    const randomAvatar = getRandomAvatar(genderForAvatar);

    if (!randomAvatar) {
      toast.error("Không tìm thấy avatar phù hợp.");
      return;
    }

    updateFormField("profilePic", randomAvatar);
    toast.success(t("language.randomAvatarToast"));
  };

  const handleUploadClick = () => {
    if (!canUploadAvatar) return;
    fileInputRef.current?.click();
  };

  const handleProfilePicUpload = (event) => {
    if (!canUploadAvatar) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("language.uploadError"));
      event.target.value = "";
      return;
    }
    if (file.size > 200 * 1024) {
      toast.error(t("language.uploadSizeError"));
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormField("profilePic", reader.result);
      toast.success(t("language.uploadSuccess"));
    };
    reader.readAsDataURL(file);
  };

  const age = authUser?.birthDate
    ? Math.max(
        18,
        new Date(Date.now() - new Date(authUser.birthDate)).getUTCFullYear() -
          1970
      )
    : null;
  const homeFlag = getCountryFlag(formState.country, formState.city);

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
              icon={MapPinIcon}
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
                  {canUploadAvatar && (
                    <>
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        className="btn btn-outline btn-sm"
                      >
                        <UploadIcon className="size-4 mr-1.5" />
                        {t("onboarding.uploadPhoto")}
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleProfilePicUpload}
                      />
                    </>
                  )}
                </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("onboarding.fullName")}</span>
                </label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(e) => updateFormField("fullName", e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("onboarding.bio")}</span>
                </label>
                <textarea
                  value={formState.bio}
                  onChange={(e) => updateFormField("bio", e.target.value)}
                  className="textarea textarea-bordered h-24"
                  placeholder={t("onboarding.bioPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("onboarding.gender")}</span>
                  </label>
                  <select
                    value={formState.gender}
                    className={selectBaseClass}
                    onChange={(e) => updateFormField("gender", e.target.value)}
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("onboarding.birthDate")}
                    </span>
                  </label>
                  <input
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("onboarding.country")}</span>
                  </label>
                  <select
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
                  <label className="label">
                    <span className="label-text">{t("onboarding.city")}</span>
                  </label>
                  <select
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
                  <label className="label">
                    <span className="label-text">
                      {t("onboarding.height")}{" "}
                      <span className="text-xs opacity-60">
                        ({t("onboarding.optional")})
                      </span>
                    </span>
                  </label>
                  <select
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
                  <label className="label">
                    <span className="label-text">
                      {t("onboarding.education")}{" "}
                      <span className="text-xs opacity-60">
                        ({t("onboarding.optional")})
                      </span>
                    </span>
                  </label>
                  <select
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
                      items: formState.pets.join(", "),
                    })}
                  </p>
                )}
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
                  <label className="label">
                    <span className="label-text">
                      {t("profile.passwordCurrent")}
                    </span>
                  </label>
                  <input
                    type="password"
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
                  <label className="label">
                    <span className="label-text">
                      {t("profile.passwordNew")}
                    </span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                  />
                  <p className="text-xs opacity-60 mt-1">
                    {t("profile.passwordHint")}
                  </p>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("profile.passwordConfirm")}
                    </span>
                  </label>
                  <input
                    type="password"
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
        </div>
      </div>
    </div>
  );
};

export default HomePage;
