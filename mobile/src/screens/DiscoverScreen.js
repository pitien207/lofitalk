import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../assets/LofiTalk_logo.png";
import { BRAND_COLORS } from "../theme/colors";
import { buttonStyles } from "../components/common/buttons";
import { formatLocation } from "../utils/profile";
import DropdownSelect from "../components/common/DropdownSelect";
import { useMemo } from "react";

const resolveImageSource = (value) => {
  if (!value) return Logo;
  if (typeof value === "string") return { uri: value };
  return value;
};

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
}) => {
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
    ],
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
        educationOptions={educationOptions}
        hobbyOptions={hobbyOptions}
        petOptions={petOptions}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        onApplyFilters={onApplyFilters}
        loading={recommendedLoading}
        error={recommendedError}
      />

      <RecommendationsList
        items={recommended}
        loading={recommendedLoading}
        error={recommendedError}
        onSendRequest={onSendRequest}
        requestingId={requestingId}
        onViewProfile={onViewProfile}
      />
    </ScrollView>
  );
};

const FilterPanel = ({
  filters,
  genderOptions,
  countryCityOptions,
  cityOptions,
  educationOptions,
  hobbyOptions,
  petOptions,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  loading,
  error,
}) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Filters</Text>
    <Text style={styles.cardSubtitle}>
      Apply filters and see recommended matches.
    </Text>

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
        placeholder={filters.country ? "Any city" : "Select a country first"}
        options={[
          { value: "", label: "Any" },
          ...cityOptions.map((city) => ({ value: city, label: city })),
        ]}
        disabled={!filters.country}
        onSelect={(value) => onFilterChange("city", value)}
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
        onPress={() => onApplyFilters().catch(() => null)}
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
  requestingId,
  onViewProfile,
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
        {items.map((user) => (
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
            <TouchableOpacity
              style={[
                buttonStyles.primaryButton,
                styles.requestButton,
                requestingId === user._id && styles.disabledButton,
              ]}
              onPress={() => onSendRequest(user._id).catch(() => null)}
              disabled={requestingId === user._id}
            >
              {requestingId === user._id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={buttonStyles.primaryButtonText}>Send request</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
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
  disabledButton: {
    opacity: 0.6,
  },
});

export default DiscoverScreen;
