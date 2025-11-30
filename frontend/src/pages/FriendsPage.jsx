
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  cancelFriendRequest,
  sendFriendRequest,
  getBlockedUsers,
  blockUser,
  unblockUser,
} from "../lib/api";
import {
  LoaderIcon,
  MapPinIcon,
  XCircleIcon,
  UserPlusIcon,
  UsersIcon,
  BanIcon,
  UnlockIcon,
} from "lucide-react";
import { getCountryFlag } from "../utils/flags";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { useTranslation } from "../languages/useTranslation";
import toast from "react-hot-toast";

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

const sortOptionsByLabel = (options) =>
  [...options].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );

const FriendsPage = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [filters, setFilters] = useState(() => createEmptyFilters());
  const [appliedFilters, setAppliedFilters] = useState(() => createEmptyFilters());
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [filterAttempt, setFilterAttempt] = useState(0);
  const [friendsPage, setFriendsPage] = useState(1);
  const [blockingId, setBlockingId] = useState(null);
  const [unblockingId, setUnblockingId] = useState(null);

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
        cities: sortOptionsByLabel([
          { value: "Da Nang", label: t("onboarding.cityOptions.vietnam.danang") },
          { value: "Hai Phong", label: t("onboarding.cityOptions.vietnam.haiphong") },
          { value: "Hanoi", label: t("onboarding.cityOptions.vietnam.hanoi") },
          { value: "Ho Chi Minh City", label: t("onboarding.cityOptions.vietnam.hcmc") },
          { value: "Hue", label: t("onboarding.cityOptions.vietnam.hue") },
          { value: "Nghe An", label: t("onboarding.cityOptions.vietnam.nghean") },
          { value: "Ninh Binh", label: t("onboarding.cityOptions.vietnam.ninhbinh") },
          { value: "Thanh Hoa", label: t("onboarding.cityOptions.vietnam.thanhhoa") },
        ]),
      },
      {
        value: "Germany",
        label: t("onboarding.countryOptions.germany"),
        cities: sortOptionsByLabel([
          { value: "Berlin", label: t("onboarding.cityOptions.germany.berlin") },
          { value: "Bremen", label: t("onboarding.cityOptions.germany.bremen") },
          { value: "Cologne", label: t("onboarding.cityOptions.germany.koln") },
          { value: "Dresden", label: t("onboarding.cityOptions.germany.dresden") },
          { value: "Frankfurt", label: t("onboarding.cityOptions.germany.frankfurt") },
          { value: "Hamburg", label: t("onboarding.cityOptions.germany.hamburg") },
          { value: "Leipzig", label: t("onboarding.cityOptions.germany.leipzig") },
          { value: "Munich", label: t("onboarding.cityOptions.germany.munich") },
          { value: "Nuremberg", label: t("onboarding.cityOptions.germany.nurnberg") },
          { value: "Stuttgart", label: t("onboarding.cityOptions.germany.stuttgart") },
        ]),
      },
      {
        value: "Japan",
        label: t("onboarding.countryOptions.japan"),
        cities: sortOptionsByLabel([
          { value: "Fukuoka", label: t("onboarding.cityOptions.japan.fukuoka") },
          { value: "Hiroshima", label: t("onboarding.cityOptions.japan.hiroshima") },
          { value: "Kobe", label: t("onboarding.cityOptions.japan.kobe") },
          { value: "Kyoto", label: t("onboarding.cityOptions.japan.kyoto") },
          { value: "Nagoya", label: t("onboarding.cityOptions.japan.nagoya") },
          { value: "Osaka", label: t("onboarding.cityOptions.japan.osaka") },
          { value: "Sapporo", label: t("onboarding.cityOptions.japan.sapporo") },
          { value: "Sendai", label: t("onboarding.cityOptions.japan.sendai") },
          { value: "Tokyo", label: t("onboarding.cityOptions.japan.tokyo") },
          { value: "Yokohama", label: t("onboarding.cityOptions.japan.yokohama") },
        ]),
      },
      {
        value: "Australia",
        label: t("onboarding.countryOptions.australia"),
        cities: sortOptionsByLabel([
          { value: "Adelaide", label: t("onboarding.cityOptions.australia.adelaide") },
          { value: "Brisbane", label: t("onboarding.cityOptions.australia.brisbane") },
          { value: "Canberra", label: t("onboarding.cityOptions.australia.canberra") },
          { value: "Gold Coast", label: t("onboarding.cityOptions.australia.goldcoast") },
          { value: "Melbourne", label: t("onboarding.cityOptions.australia.melbourne") },
          { value: "Perth", label: t("onboarding.cityOptions.australia.perth") },
          { value: "Sydney", label: t("onboarding.cityOptions.australia.sydney") },
        ]),
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

  const filterParams = useMemo(
    () => (hasAppliedFilters ? buildFilterParams(appliedFilters) : {}),
    [appliedFilters, hasAppliedFilters]
  );

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: blockedData = { blocked: [] },
    isLoading: loadingBlocked,
  } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: getBlockedUsers,
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("friends.blockError"));
    },
  });

  const blockedUsers = blockedData?.blocked || [];

  useEffect(() => {
    setFriendsPage(1);
  }, [friends.length]);

  const FRIENDS_PER_PAGE = 10;
  const totalFriendPages = Math.max(1, Math.ceil(friends.length / FRIENDS_PER_PAGE));
  const boundedFriendsPage = Math.min(friendsPage, totalFriendPages);
  useEffect(() => {
    if (friendsPage !== boundedFriendsPage) {
      setFriendsPage(boundedFriendsPage);
    }
  }, [boundedFriendsPage, friendsPage]);
  const paginatedFriends = friends.slice(
    (boundedFriendsPage - 1) * FRIENDS_PER_PAGE,
    boundedFriendsPage * FRIENDS_PER_PAGE
  );

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: recommendationData,
    isFetching: loadingRecommendations,
    refetch: fetchRecommendations,
  } = useQuery({
    queryKey: ["users", filterParams, filterAttempt],
    queryFn: () => getRecommendedUsers(filterParams),
    enabled: false,
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || t("friends.filters.applyError")
      );
    },
  });

  const recommendedUsers = hasAppliedFilters
    ? recommendationData?.users ?? []
    : [];

  useEffect(() => {
    if (hasAppliedFilters && filterAttempt > 0) {
      fetchRecommendations();
    }
  }, [hasAppliedFilters, filterAttempt, filterParams, fetchRecommendations]);

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  const { mutate: cancelRequestMutation, isPending: isCancelling } =
    useMutation({
      mutationFn: cancelFriendRequest,
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
    });

  const { mutate: blockUserMutation } = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      toast.success(t("friends.blockSuccess"));
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("friends.blockError"));
    },
    onSettled: () => setBlockingId(null),
  });

  const { mutate: unblockUserMutation } = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      toast.success(t("friends.unblockSuccess"));
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("friends.unblockError"));
    },
    onSettled: () => setUnblockingId(null),
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
    }
    setOutgoingRequestsIds(outgoingIds);
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
  };

  const handleBlockUser = (userId) => {
    if (!userId) return;
    const confirmed = window.confirm(t("friends.blockConfirm"));
    if (!confirmed) return;
    setBlockingId(userId);
    blockUserMutation(userId);
  };

  const handleUnblockUser = (userId) => {
    if (!userId) return;
    setUnblockingId(userId);
    unblockUserMutation(userId);
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedFriends.map((friend) => (
                <FriendCard
                  key={friend._id}
                  friend={friend}
                  onBlock={handleBlockUser}
                  isBlocking={blockingId === friend._id}
                />
              ))}
            </div>
            {friends.length > FRIENDS_PER_PAGE && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setFriendsPage((page) => Math.max(1, page - 1))}
                  disabled={boundedFriendsPage === 1}
                >
                  {t("common.prev") || "Prev"}
                </button>
                <span className="text-sm font-semibold">
                  {boundedFriendsPage} / {totalFriendPages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    setFriendsPage((page) => Math.min(totalFriendPages, page + 1))
                  }
                  disabled={boundedFriendsPage === totalFriendPages}
                >
                  {t("common.next") || "Next"}
                </button>
              </div>
            )}
          </div>
        )}

        <section className="card bg-base-200 border border-white/5 shadow-sm">
          <div className="card-body p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BanIcon className="size-5 text-error" />
                <h3 className="text-lg sm:text-xl font-semibold">
                  {t("friends.blockedTitle")}
                </h3>
              </div>
              {loadingBlocked ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
            </div>
            <p className="text-sm text-base-content/70">
              {t("friends.blockedSubtitle")}
            </p>

            {blockedUsers.length === 0 ? (
              <p className="text-sm opacity-70">{t("friends.blockedEmpty")}</p>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((user) => {
                  const locationText =
                    [user.city, user.country].filter(Boolean).join(", ") ||
                    user.location ||
                    "";
                  const flagSrc = getCountryFlag(
                    user.country,
                    user.city,
                    user.location
                  );
                  const isUnblocking = unblockingId === user._id;

                  return (
                    <div
                      key={user._id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-base-300/40 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar size-12 rounded-full ring ring-base-300">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">
                            {user.fullName}
                          </p>
                          {locationText ? (
                            <div className="flex items-center gap-1 text-xs opacity-70">
                              {flagSrc ? (
                                <div className="w-5 h-3 overflow-hidden rounded-[4px] border border-base-300 shadow-sm">
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
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleUnblockUser(user._id)}
                        disabled={isUnblocking}
                      >
                        {isUnblocking ? (
                          <span className="loading loading-spinner loading-xs mr-2" />
                        ) : (
                          <UnlockIcon className="size-4 mr-2" />
                        )}
                        {t("friends.unblockAction")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("friends.filters.genderLabel")}</span>
                  </label>
                  <select
                    className="select select-bordered lofitalk-select"
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
                    className="select select-bordered lofitalk-select"
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
                    className="select select-bordered lofitalk-select"
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
                    className="select select-bordered lofitalk-select"
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
                    className="select select-bordered lofitalk-select"
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
                    className="select select-bordered lofitalk-select"
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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm opacity-70 leading-relaxed">
                    {t("friends.filters.applyHint")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end sm:items-center w-full sm:w-auto">
                  <button
                    type="button"
                    className="btn btn-ghost w-full sm:w-auto"
                    onClick={handleResetFilters}
                  >
                    {t("friends.filters.reset")}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary w-full sm:w-auto"
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
                const hasIncomingRequest = Boolean(user.pendingRequestReceived);
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

                      <p
                        className="text-sm opacity-70"
                        style={{
                          minHeight: "2.5rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {user.bio?.trim() ? user.bio : "\u00A0"}
                      </p>

                      {hasIncomingRequest ? (
                        <p className="text-xs opacity-70 mt-1">
                          {t("home.pendingFromThem") ||
                            "This user sent you a request. Please respond in Notifications."}
                        </p>
                      ) : (
                        <button
                          className={`btn w-full mt-2 ${
                            hasRequestBeenSent ? "btn-outline" : "btn-primary"
                          }`}
                          onClick={() =>
                            hasRequestBeenSent
                              ? cancelRequestMutation(user._id)
                              : sendRequestMutation(user._id)
                          }
                          disabled={
                            hasRequestBeenSent ? isCancelling : isPending
                          }
                        >
                          {hasRequestBeenSent ? (
                            <>
                              {isCancelling ? (
                                <LoaderIcon className="size-4 mr-2 animate-spin" />
                              ) : (
                                <XCircleIcon className="size-4 mr-2" />
                              )}
                              {isCancelling
                                ? t("profile.saving")
                                : t("home.cancelRequest")}
                            </>
                          ) : (
                            <>
                              {isPending ? (
                                <LoaderIcon className="size-4 mr-2 animate-spin" />
                              ) : (
                                <UserPlusIcon className="size-4 mr-2" />
                              )}
                              {t("home.sendRequest")}
                            </>
                          )}
                        </button>
                      )}
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
