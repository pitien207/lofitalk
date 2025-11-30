import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BRAND_COLORS } from "../theme/colors";
import { buttonStyles } from "../components/common/buttons";
import { formatLocation } from "../utils/profile";
import DropdownSelect from "../components/common/DropdownSelect";
import { useMemo, useState } from "react";
import { resolveImageSource } from "../utils/imageSource";
import { birthCountryOptions as baseBirthCountryOptions } from "../constants/profileOptions";

const DiscoverScreen = ({
  filters,
  recommended,
  recommendedLoading,
  recommendedError,
  requestingId,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  onSendRequest,
  onViewProfile,
  onCancelRequest,
  hasPendingRequest,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const genderOptions = useMemo(
    () => [
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
      { value: "non-binary", label: "Non-binary" },
      { value: "prefer_not_say", label: "Prefer not to say" },
    ],
    []
  );

  const countryCityOptions = useMemo(
    () => [
      {
        value: "Vietnam",
        label: "Vietnam",
        cities: [
          "Can Tho",
          "Da Lat",
          "Da Nang",
          "Hai Phong",
          "Hanoi",
          "Ho Chi Minh City",
          "Hue",
          "Nam Dinh",
          "Nghe An",
          "Ninh Binh",
          "Quy Nhon",
          "Thanh Hoa",
          "Vinh",
          "Vung Tau",
        ],
      },
      {
        value: "Germany",
        label: "Germany",
        cities: [
          "Berlin",
          "Bonn",
          "Bremen",
          "Cologne",
          "Dresden",
          "Dusseldorf",
          "Hanover",
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
    ],
    []
  );

  const birthCountryOptions = useMemo(
    () => baseBirthCountryOptions,
    []
  );

  const educationOptions = useMemo(
    () => [
      { value: "High school graduate", label: "High school graduate" },
      { value: "University", label: "University" },
      { value: "Vocational training", label: "Vocational training" },
      { value: "Working professional", label: "Working professional" },
    ],
    []
  );

  const hobbyOptions = useMemo(
    () => [
      { value: "Music & concerts", label: "Music & concerts" },
      { value: "Traveling", label: "Traveling" },
      { value: "Cooking & baking", label: "Cooking & baking" },
      { value: "Video games", label: "Video games" },
      { value: "Reading", label: "Reading" },
      { value: "Fitness & gym", label: "Fitness & gym" },
      { value: "Photography", label: "Photography" },
      { value: "Art & design", label: "Art & design" },
      { value: "Movies & series", label: "Movies & series" },
      { value: "Hiking & outdoors", label: "Hiking & outdoors" },
    ],
    []
  );

  const petOptions = useMemo(
    () => [
      { value: "Dog", label: "Dog" },
      { value: "Cat", label: "Cat" },
      { value: "Hamster", label: "Hamster" },
      { value: "Bird", label: "Bird" },
      { value: "Fish", label: "Fish" },
    ],
    []
  );

  const availableCities = useMemo(() => {
    const match = countryCityOptions.find(
      (country) => country.value === filters.country
    );
    return match?.cities || [];
  }, [countryCityOptions, filters.country]);

  const availableBirthCities = useMemo(() => {
    const match = birthCountryOptions.find(
      (country) => country.value === filters.birthCountry
    );
    return match?.cities || [];
  }, [birthCountryOptions, filters.birthCountry]);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            Set filters and find new friends to connect with.
          </Text>
        </View>
      </View>

      <FilterPanel
        filters={filters}
        genderOptions={genderOptions}
        countryCityOptions={countryCityOptions}
        cityOptions={availableCities}
        birthCountryOptions={birthCountryOptions}
        birthCityOptions={availableBirthCities}
        educationOptions={educationOptions}
        hobbyOptions={hobbyOptions}
        petOptions={petOptions}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
      onApplyFilters={onApplyFilters}
      loading={recommendedLoading}
      error={recommendedError}
      collapsed={collapsed}
      onToggleCollapsed={() => setCollapsed((prev) => !prev)}
      onCollapse={() => setCollapsed(true)}
    />

      <RecommendationsList
        items={recommended}
        loading={recommendedLoading}
        error={recommendedError}
        onSendRequest={onSendRequest}
        onCancelRequest={onCancelRequest}
        hasPendingRequest={hasPendingRequest}
        requestingId={requestingId}
        onViewProfile={onViewProfile}
        onIncomingRequestLabel="This user sent you a request. Please respond in Notifications."
      />
    </ScrollView>
  );
};

const FilterPanel = ({
  filters,
  genderOptions,
  countryCityOptions,
  cityOptions,
  birthCountryOptions,
  birthCityOptions,
  educationOptions,
  hobbyOptions,
  petOptions,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  loading,
  error,
  collapsed,
  onToggleCollapsed,
  onCollapse,
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeaderRow}>
      <View>
        <Text style={styles.cardTitle}>Filters</Text>
      </View>
      <TouchableOpacity
        style={styles.collapsePill}
        onPress={onToggleCollapsed}
        activeOpacity={0.8}
      >
        <Text style={styles.collapsePillText}>
          {collapsed ? "Show" : "Hide"}
        </Text>
      </TouchableOpacity>
    </View>

    {!collapsed && (
      <>
        <View style={styles.filterGrid}>
          <DropdownSelect
            label="Gender"
            value={filters.gender}
            placeholder="Any"
            options={[{ value: "", label: "Any" }, ...genderOptions]}
            onSelect={(value) => onFilterChange("gender", value)}
          />
          <DropdownSelect
            label="Country"
            value={filters.country}
            placeholder="Any country"
            options={[{ value: "", label: "Any" }, ...countryCityOptions]}
            onSelect={(value) => onFilterChange("country", value)}
          />
          <DropdownSelect
            label="City"
            value={filters.city}
            placeholder={
              filters.country ? "Any city" : "Select a country first"
            }
            options={[
              { value: "", label: "Any" },
              ...cityOptions.map((city) => ({ value: city, label: city })),
            ]}
            disabled={!filters.country}
            onSelect={(value) => onFilterChange("city", value)}
          />
          <DropdownSelect
            label="Birth country"
            value={filters.birthCountry}
            placeholder="Any country"
            options={[
              { value: "", label: "Any" },
              ...birthCountryOptions.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
            onSelect={(value) => onFilterChange("birthCountry", value)}
          />
          <DropdownSelect
            label="Birth city"
            value={filters.birthCity}
            placeholder={
              filters.birthCountry ? "Any city" : "Select a country first"
            }
            options={[
              { value: "", label: "Any" },
              ...birthCityOptions.map((city) => ({ value: city, label: city })),
            ]}
            disabled={!filters.birthCountry}
            onSelect={(value) => onFilterChange("birthCity", value)}
          />
          <DropdownSelect
            label="Education"
            value={filters.education}
            placeholder="Any"
            options={[{ value: "", label: "Any" }, ...educationOptions]}
            onSelect={(value) => onFilterChange("education", value)}
          />
          <DropdownSelect
            label="Hobby"
            value={filters.hobby}
            placeholder="Any"
            options={[{ value: "", label: "Any" }, ...hobbyOptions]}
            onSelect={(value) => onFilterChange("hobby", value)}
          />
          <DropdownSelect
            label="Pet"
            value={filters.pet}
            placeholder="Any"
            options={[{ value: "", label: "Any" }, ...petOptions]}
            onSelect={(value) => onFilterChange("pet", value)}
          />
          <DropdownSelect
            label="Minimum height (cm)"
            value={filters.heightMin}
            placeholder="Any"
            options={[
              { value: "", label: "Any" },
              { value: "150", label: "150+" },
              { value: "160", label: "160+" },
              { value: "170", label: "170+" },
              { value: "180", label: "180+" },
            ]}
            onSelect={(value) => onFilterChange("heightMin", value)}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </>
    )}

    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.secondaryButton, loading && styles.disabledButton]}
        onPress={onResetFilters}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          buttonStyles.primaryButton,
          styles.applyButton,
          loading && styles.disabledButton,
        ]}
        onPress={() =>
          onApplyFilters()
            .catch(() => null)
            .finally(() => onCollapse?.())
        }
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={buttonStyles.primaryButtonText}>Apply filters</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const RecommendationsList = ({
  items,
  loading,
  error,
  onSendRequest,
  onCancelRequest,
  hasPendingRequest,
  requestingId,
  onViewProfile,
  onIncomingRequestLabel,
}) => (
  <View style={styles.recommendationsWrapper}>
    <Text style={styles.recommendationsTitle}>Recommendations</Text>
    {loading ? (
      <View style={styles.stateCard}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.stateText}>Loading matches...</Text>
      </View>
    ) : error ? (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>{error}</Text>
      </View>
    ) : items?.length === 0 ? (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>
          No recommendations yet. Try adjusting your filters.
        </Text>
      </View>
    ) : (
      <View style={styles.recommendationList}>
        {items.map((user) => {
          const isPending = hasPendingRequest?.(user._id);
          const isRequesting = requestingId === user._id;
          const incomingRequest = Boolean(user.pendingRequestReceived);
          const label = isRequesting
            ? isPending
              ? "Cancelling..."
              : "Sending..."
            : isPending
            ? "Cancel request"
            : "Send request";

          return (
            <View key={user._id} style={styles.recommendationCard}>
              <TouchableOpacity
                style={styles.recommendationContent}
                activeOpacity={0.85}
                onPress={() => onViewProfile?.(user._id)}
              >
                <View style={styles.avatarWrapper}>
                  <Image
                    source={resolveImageSource(user.profilePic)}
                    style={styles.avatar}
                  />
                  {user.isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name}>{user.fullName}</Text>
                  <Text style={styles.location}>
                    {user.location || formatLocation(user) || "Somewhere cozy"}
                  </Text>
                  <Text style={styles.bio} numberOfLines={2}>
                    {user.bio || "Say hi and start a conversation."}
                  </Text>
                </View>
              </TouchableOpacity>
              {incomingRequest ? (
                <Text style={styles.incomingLabel}>
                  {onIncomingRequestLabel ||
                    "This user sent you a request. Please respond in Notifications."}
                </Text>
              ) : (
                <TouchableOpacity
                  style={[
                    isPending
                      ? buttonStyles.secondaryOutlineButton
                      : buttonStyles.primaryButton,
                    styles.requestButton,
                    isRequesting && styles.disabledButton,
                  ]}
                  onPress={() =>
                    (isPending
                      ? onCancelRequest?.(user._id)
                      : onSendRequest?.(user._id)
                    ).catch(() => null)
                  }
                  disabled={isRequesting}
                >
                  {isRequesting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={
                        isPending
                          ? buttonStyles.secondaryOutlineText
                          : buttonStyles.primaryButtonText
                      }
                    >
                      {label}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: BRAND_COLORS.text,
  },
  subtitle: {
    color: BRAND_COLORS.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  cardTitle: {
    color: BRAND_COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: BRAND_COLORS.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  collapsePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  collapsePillText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  filterGrid: {
    gap: 10,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: BRAND_COLORS.text,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
  },
  errorText: {
    color: "#FEB2B2",
    marginTop: 8,
  },
  recommendationsWrapper: {
    marginTop: 10,
    gap: 12,
  },
  recommendationsTitle: {
    color: BRAND_COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  stateCard: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  stateText: {
    color: BRAND_COLORS.muted,
    marginTop: 6,
    textAlign: "center",
  },
  recommendationList: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 10,
  },
  recommendationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: BRAND_COLORS.background,
  },
  meta: {
    flex: 1,
    marginTop: 8,
  },
  name: {
    color: BRAND_COLORS.text,
    fontWeight: "700",
    fontSize: 16,
  },
  location: {
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  bio: {
    color: BRAND_COLORS.muted,
    marginTop: 6,
  },
  requestButton: {
    marginTop: 10,
  },
  incomingLabel: {
    marginTop: 8,
    color: BRAND_COLORS.muted,
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default DiscoverScreen;
