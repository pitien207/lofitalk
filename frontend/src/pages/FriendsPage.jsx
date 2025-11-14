
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getTarotEnergy,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { getCountryFlag } from "../utils/flags";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { useTranslation } from "../languages/useTranslation";
import "../tarot.css";

const createEmptyFilters = () => ({
  gender: "",
  country: "",
  city: "",
  heightMin: "",
  education: "",
  hobby: "",
  pet: "",
});

const buildFilterParams = (filterState) => {
  const params = {};
  if (filterState.gender) params.gender = filterState.gender;
  if (filterState.country) params.country = filterState.country;
  if (filterState.city) params.city = filterState.city;
  if (filterState.heightMin) params.heightMin = filterState.heightMin;
  if (filterState.education) params.education = filterState.education;
  if (filterState.hobby) params.hobby = filterState.hobby;
  if (filterState.pet) params.pet = filterState.pet;
  return params;
};

const ENERGY_MAX = 7;

const FriendsPage = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [filters, setFilters] = useState(() => createEmptyFilters());
  const [appliedFilters, setAppliedFilters] = useState(() => createEmptyFilters());
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [energy, setEnergy] = useState(null);
  const [filterAttempt, setFilterAttempt] = useState(0);

  const genderOptions = useMemo(
    () => [
      { value: "female", label: t("onboarding.genderOptions.female") },
      { value: "male", label: t("onboarding.genderOptions.male") },
      { value: "non-binary", label: t("onboarding.genderOptions.nonBinary") },
      { value: "prefer_not_say", label: t("onboarding.genderOptions.preferNotSay") },
    ],
    [t]
  );

  const countryCityOptions = useMemo(
    () => [
      {
        value: "Vietnam",
        label: t("onboarding.countryOptions.vietnam"),
        cities: [
          { value: "Hanoi", label: t("onboarding.cityOptions.vietnam.hanoi") },
          { value: "Ho Chi Minh City", label: t("onboarding.cityOptions.vietnam.hcmc") },
          { value: "Da Nang", label: t("onboarding.cityOptions.vietnam.danang") },
        ],
      },
      {
        value: "Germany",
        label: t("onboarding.countryOptions.germany"),
        cities: [
          { value: "Berlin", label: t("onboarding.cityOptions.germany.berlin") },
          { value: "Munich", label: t("onboarding.cityOptions.germany.munich") },
          { value: "Hamburg", label: t("onboarding.cityOptions.germany.hamburg") },
        ],
      },
      {
        value: "Japan",
        label: t("onboarding.countryOptions.japan"),
        cities: [
          { value: "Tokyo", label: t("onboarding.cityOptions.japan.tokyo") },
          { value: "Osaka", label: t("onboarding.cityOptions.japan.osaka") },
          { value: "Kyoto", label: t("onboarding.cityOptions.japan.kyoto") },
        ],
      },
      {
        value: "Australia",
        label: t("onboarding.countryOptions.australia"),
        cities: [
          { value: "Sydney", label: t("onboarding.cityOptions.australia.sydney") },
          { value: "Melbourne", label: t("onboarding.cityOptions.australia.melbourne") },
          { value: "Brisbane", label: t("onboarding.cityOptions.australia.brisbane") },
        ],
      },
    ],
    [t]
  );

  const educationOptions = useMemo(
    () => [
      { value: "High school graduate", label: t("onboarding.educationOptions.highSchool") },
      { value: "University", label: t("onboarding.educationOptions.university") },
      { value: "Vocational training", label: t("onboarding.educationOptions.vocational") },
      { value: "Working professional", label: t("onboarding.educationOptions.working") },
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

  const selectedCountry = countryCityOptions.find((country) => country.value === filters.country);
  const availableCities = selectedCountry?.cities || [];

  const { data: energyData, isLoading: loadingEnergy } = useQuery({
    queryKey: ["tarotEnergy"],
    queryFn: getTarotEnergy,
  });

  useEffect(() => {
    if (typeof energyData?.energy === "number") {
      setEnergy(energyData.energy);
    }
  }, [energyData]);
  const resolvedEnergy =
    typeof energy === "number"
      ? energy
      : typeof energyData?.energy === "number"
      ? energyData.energy
      : null;
  const normalizedEnergy = Math.max(
    0,
    Math.min(resolvedEnergy ?? 0, ENERGY_MAX)
  );
  const lastRefillLabel = energyData?.lastRefill
    ? new Date(energyData.lastRefill).toLocaleDateString()
    : t("tarot.energy.pendingDate");
  const energyDisplayValue =
    resolvedEnergy === null
      ? (loadingEnergy ? "..." : "--")
      : resolvedEnergy;
  const energySummary = t("tarot.energy.summary", {
    current: energyDisplayValue,
    max: ENERGY_MAX,
  });
  const regenHint = t("tarot.energy.regenHint", { date: lastRefillLabel });


  const filterParams = useMemo(
    () => (hasAppliedFilters ? buildFilterParams(appliedFilters) : {}),
    [appliedFilters, hasAppliedFilters]
  );

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const {
    data: recommendationData,
    isLoading: loadingRecommendations,
  } = useQuery({
    queryKey: ["users", filterParams, filterAttempt],
    queryFn: () => getRecommendedUsers(filterParams),
    enabled: hasAppliedFilters && filterAttempt > 0,
    onSuccess: (data) => {
      if (typeof data?.energy === "number") {
        setEnergy(data.energy);
      }
      queryClient.setQueryData(["tarotEnergy"], (prev) => {
        if (!prev) return prev;
        return { ...prev, energy: data?.energy ?? prev.energy };
      });
      queryClient.invalidateQueries({ queryKey: ["tarotEnergy"] });
    },
  });

  const recommendedUsers = hasAppliedFilters
    ? recommendationData?.users ?? []
    : [];

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  const updateFilterField = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "country" ? { city: "" } : {}),
    }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    if (resolvedEnergy !== null && resolvedEnergy <= 0) {
      toast.error(t("friends.filters.energyError"));
      return;
    }
    const baseEnergy =
      typeof energy === "number"
        ? energy
        : typeof energyData?.energy === "number"
        ? energyData.energy
        : null;
    if (baseEnergy !== null) {
      setEnergy(Math.max(baseEnergy - 1, 0));
    }
    setAppliedFilters({ ...filters });
    setHasAppliedFilters(true);
    setFilterAttempt((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    const reset = createEmptyFilters();
    setFilters(reset);
    setAppliedFilters(reset);
    setHasAppliedFilters(false);
    setFilterAttempt(0);
    setEnergy((prev) =>
      typeof energyData?.energy === "number" ? energyData.energy : prev
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("home.yourFriends")}
          </h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            {t("home.friendRequests")}
          </Link>
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {t("home.meetTitle")}
                </h2>
                <p className="opacity-70">{t("home.meetSubtitle")}</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-white/5 shadow-sm mb-8">
            <form className="p-4 sm:p-6 space-y-4" onSubmit={handleApplyFilters}>
              <div className="flex flex-col gap-2 text-sm">
                <span className="font-semibold">
                  {t("friends.filters.energyTitle")}
                </span>
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{energySummary}</div>
                  <div className="energy-bar">
                    <div
                      className="energy-bar__fill"
                      style={{
                        width: `${(normalizedEnergy / ENERGY_MAX) * 100}%`,
                      }}
                    />
                    <div className="energy-bar__icons">
                      {Array.from({ length: ENERGY_MAX }).map((_, idx) => (
                        <span
                          key={`energy-${idx}`}
                          className={`energy-orb ${
                            idx < normalizedEnergy ? "energy-orb--active" : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] opacity-60">{regenHint}</p>
                </div>
                <p className="text-xs opacity-70">
                  {t("friends.filters.energyHint")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.genderLabel")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={filters.gender}
                    onChange={(e) => updateFilterField("gender", e.target.value)}
                  >
                    <option value="">{t("friends.filters.anyOption")}</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.countryLabel")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={filters.country}
                    onChange={(e) => updateFilterField("country", e.target.value)}
                  >
                    <option value="">{t("friends.filters.anyOption")}</option>
                    {countryCityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.cityLabel")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={filters.city}
                    onChange={(e) => updateFilterField("city", e.target.value)}
                    disabled={!filters.country}
                  >
                    <option value="">{t("friends.filters.anyOption")}</option>
                    {availableCities.map((city) => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.heightLabel")}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered"
                    placeholder={t("friends.filters.heightPlaceholder")}
                    value={filters.heightMin}
                    onChange={(e) => updateFilterField("heightMin", e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.educationLabel")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={filters.education}
                    onChange={(e) => updateFilterField("education", e.target.value)}
                  >
                    <option value="">{t("friends.filters.anyOption")}</option>
                    {educationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.hobbyLabel")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={filters.hobby}
                    onChange={(e) => updateFilterField("hobby", e.target.value)}
                  >
                    <option value="">{t("friends.filters.anyOption")}</option>
                    {hobbyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.petLabel")}</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={filters.pet}
                    onChange={(e) => updateFilterField("pet", e.target.value)}
                  >
                    <option value="">{t("friends.filters.anyOption")}</option>
                    {petOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm opacity-70">
                  {t("friends.filters.applyHint")}
                </p>
                <div className="flex gap-3 justify-end">
                  <button type="button" className="btn btn-ghost" onClick={handleResetFilters}>
                    {t("friends.filters.reset")}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={resolvedEnergy !== null && resolvedEnergy <= 0}
                  >
                    {t("friends.filters.apply")}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {!hasAppliedFilters ? (
            <div className="card bg-base-200 p-6 text-center">
              <p className="text-base-content opacity-80">
                {t("friends.filters.emptyState")}
              </p>
            </div>
          ) : loadingRecommendations ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                {t("home.noRecommendations")}
              </h3>
              <p className="text-base-content opacity-70">
                {t("home.checkLater")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
                const locationText =
                  [user.city, user.country].filter(Boolean).join(', ') ||
                  user.location ||
                  '';
                const flagSrc = getCountryFlag(
                  user.country,
                  user.city,
                  user.location || locationText
                );

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <Link
                        to={`/profile/${user._id}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <div className="avatar size-16 rounded-full ring ring-primary/20">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          {locationText && (
                            <div className="flex items-center text-xs opacity-70 mt-1 gap-1.5">
                              {flagSrc ? (
                                <div className="w-6 h-4 overflow-hidden rounded-[4px] border border-base-300 shadow-sm">
                                  <img
                                    src={flagSrc}
                                    alt={user.country}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <MapPinIcon className="size-3" />
                              )}
                              <span>{locationText}</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent ? 'btn-disabled' : 'btn-primary'
                        } `}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            {t("home.requestSent")}
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            {t("home.sendRequest")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FriendsPage;
