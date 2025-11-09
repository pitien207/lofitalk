import { useRef, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { useTranslation } from "../languages/useTranslation";
import {
  CameraIcon,
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
  ShuffleIcon,
  UploadIcon,
} from "lucide-react";

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

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    gender: authUser?.gender || "",
    birthDate: initialBirthDate,
    country: authUser?.country || "",
    city: authUser?.city || "",
    height: authUser?.height || "",
    education: authUser?.education || "",
    datingGoal: authUser?.datingGoal || "",
    hobbies: authUser?.hobbies || "",
    pets: authUser?.pets || "",
    profilePic: authUser?.profilePic || "",
  });

  const GENDER_OPTIONS = [
    { value: "", label: t("onboarding.genderPlaceholder") },
    { value: "female", label: t("onboarding.genderOptions.female") },
    { value: "male", label: t("onboarding.genderOptions.male") },
    { value: "non-binary", label: t("onboarding.genderOptions.nonBinary") },
    { value: "prefer_not_say", label: t("onboarding.genderOptions.preferNot") },
  ];

  const fileInputRef = useRef(null);

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

    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; // 1-100 included
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success(t("language.randomAvatarToast"));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePicUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("language.uploadError"));
      event.target.value = "";
      return;
    }

    if (file.size > 100 * 1024) {
      toast.error(t("language.uploadSizeError"));
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormState((prev) => ({ ...prev, profilePic: reader.result }));
      toast.success(t("language.uploadSuccess"));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            {t("onboarding.title")}
          </h1>

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
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="btn btn-outline"
                >
                  <UploadIcon className="size-4 mr-2" />
                  {t("onboarding.uploadPhoto")}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleProfilePicUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("onboarding.fullName")}</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="Your full name"
              />
            </div>

            {/* BIO */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("onboarding.bio")}</span>
              </label>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) =>
                  setFormState({ ...formState, bio: e.target.value })
                }
                className="textarea textarea-bordered h-24"
                placeholder={t("onboarding.bioPlaceholder")}
              />
            </div>

            {/* CORE INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("onboarding.gender")}
                  </span>
                </label>
                <select
                  name="gender"
                  value={formState.gender}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      gender: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("onboarding.birthDate")}</span>
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formState.birthDate}
                  onChange={(e) =>
                    setFormState({ ...formState, birthDate: e.target.value })
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
                <input
                  type="text"
                  name="country"
                  value={formState.country}
                  onChange={(e) =>
                    setFormState({ ...formState, country: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder={t("onboarding.countryPlaceholder")}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("onboarding.city")}</span>
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                  <input
                    type="text"
                    name="city"
                    value={formState.city}
                    onChange={(e) =>
                      setFormState({ ...formState, city: e.target.value })
                    }
                    className="input input-bordered w-full pl-10"
                    placeholder={t("onboarding.cityPlaceholder")}
                    required
                  />
                </div>
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
                <input
                  type="text"
                  name="height"
                  value={formState.height}
                  onChange={(e) =>
                    setFormState({ ...formState, height: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder={t("onboarding.heightPlaceholder")}
                />
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
                <input
                  type="text"
                  name="education"
                  value={formState.education}
                  onChange={(e) =>
                    setFormState({ ...formState, education: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder={t("onboarding.educationPlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("onboarding.datingGoal")}{" "}
                    <span className="text-xs opacity-60">
                      ({t("onboarding.optional")})
                    </span>
                  </span>
                </label>
                <textarea
                  name="datingGoal"
                  value={formState.datingGoal}
                  onChange={(e) =>
                    setFormState({ ...formState, datingGoal: e.target.value })
                  }
                  className="textarea textarea-bordered h-24"
                  placeholder={t("onboarding.datingGoalPlaceholder")}
                />
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
                <textarea
                  name="hobbies"
                  value={formState.hobbies}
                  onChange={(e) =>
                    setFormState({ ...formState, hobbies: e.target.value })
                  }
                  className="textarea textarea-bordered h-24"
                  placeholder={t("onboarding.hobbiesPlaceholder")}
                />
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
              <input
                type="text"
                name="pets"
                value={formState.pets}
                onChange={(e) =>
                  setFormState({ ...formState, pets: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder={t("onboarding.petsPlaceholder")}
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
