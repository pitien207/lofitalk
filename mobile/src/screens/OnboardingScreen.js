import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BRAND_COLORS } from "../theme/colors";
import { buttonStyles } from "../components/common/buttons";
import { completeOnboardingRequest } from "../services/authService";
import { parseListField } from "../utils/profile";

const REQUIRED_FIELDS = ["fullName", "gender", "birthDate", "country", "city"];

const genderOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_say", label: "Prefer not say" },
];

const countryCityOptions = [
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

const educationOptions = [
  "High school graduate",
  "University",
  "Vocational training",
  "Working professional",
];

const hobbyOptions = [
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

const petOptions = ["Dog", "Cat", "Bird", "Fish", "Hamster", "Other"];

const OnboardingScreen = ({ user, onComplete }) => {
  const [formState, setFormState] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    gender: user?.gender || "",
    birthDate: user?.birthDate
      ? new Date(user.birthDate).toISOString().slice(0, 10)
      : "",
    country: user?.country || "",
    city: user?.city || "",
    height: user?.height || "",
    education: user?.education || "",
    hobbies: parseListField(user?.hobbies),
    pets: parseListField(user?.pets),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableCities = useMemo(() => {
    return (
      countryCityOptions.find(
        (country) => country.value === formState.country
      )?.cities || []
    );
  }, [formState.country]);

  const handleFieldChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleCountrySelect = (country) => {
    const currentCities =
      countryCityOptions.find((item) => item.value === country)?.cities || [];
    const keepCity = currentCities.includes(formState.city)
      ? formState.city
      : "";
    setFormState((prev) => ({
      ...prev,
      country,
      city: keepCity,
    }));
    setError("");
  };

  const toggleMultiValue = (field, value) => {
    setFormState((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
    setError("");
  };

  const validate = () => {
    const missing = REQUIRED_FIELDS.filter(
      (key) => !formState[key]?.toString().trim()
    );
    if (missing.length) {
      setError("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");
    try {
      const payload = {
        ...formState,
        hobbies: formState.hobbies.join(", "),
        pets: formState.pets.join(", "),
      };
      const response = await completeOnboardingRequest(payload);
      const updatedUser = response?.user;
      if (updatedUser) {
        Alert.alert("Profile completed", "Welcome to LofiTalk!");
        onComplete(updatedUser);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || "Unable to complete onboarding.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.wrapper}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Share a few details so friends know you better.
        </Text>

        <TextInput
          placeholder="Full name / Nickname"
          placeholderTextColor="#A0A6B7"
          value={formState.fullName}
          onChangeText={(value) => handleFieldChange("fullName", value)}
          style={styles.input}
        />

        <TextInput
          placeholder="Short bio"
          placeholderTextColor="#A0A6B7"
          value={formState.bio}
          onChangeText={(value) => handleFieldChange("bio", value)}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.sectionLabel}>Gender*</Text>
        <View style={styles.chipRow}>
          {genderOptions.map((option) => {
            const active = formState.gender === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleFieldChange("gender", option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Country*</Text>
        <View style={styles.chipRow}>
          {countryCityOptions.map((option) => {
            const active = formState.country === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleCountrySelect(option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>City*</Text>
        <View style={styles.chipRow}>
          {availableCities.length === 0 ? (
            <Text style={styles.helperText}>
              Select a country to see cities.
            </Text>
          ) : (
            availableCities.map((city) => {
              const active = formState.city === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleFieldChange("city", city)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TextInput
          placeholder="Birth date (YYYY-MM-DD)*"
          placeholderTextColor="#A0A6B7"
          value={formState.birthDate}
          onChangeText={(value) => handleFieldChange("birthDate", value)}
          style={styles.input}
        />

        <TextInput
          placeholder="Height"
          placeholderTextColor="#A0A6B7"
          value={formState.height}
          onChangeText={(value) => handleFieldChange("height", value)}
          style={styles.input}
        />

        <Text style={styles.sectionLabel}>Education</Text>
        <View style={styles.chipRow}>
          {educationOptions.map((option) => {
            const active = formState.education === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleFieldChange("education", option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Hobbies</Text>
        <View style={styles.chipRow}>
          {hobbyOptions.map((option) => {
            const active = formState.hobbies.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleMultiValue("hobbies", option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Pets</Text>
        <View style={styles.chipRow}>
          {petOptions.map((option) => {
            const active = formState.pets.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleMultiValue("pets", option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            buttonStyles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={buttonStyles.primaryButtonText}>Complete profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 64,
    gap: 14,
  },
  title: {
    color: BRAND_COLORS.text,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: BRAND_COLORS.muted,
    textAlign: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: BRAND_COLORS.text,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  chipText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#0F0C1D",
  },
  helperText: {
    color: BRAND_COLORS.muted,
  },
  error: {
    color: "#FEB2B2",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default OnboardingScreen;
