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
  Image,
} from "react-native";
import { BRAND_COLORS } from "../theme/colors";
import { buttonStyles } from "../components/common/buttons";
import * as ImagePicker from "expo-image-picker";
import { completeOnboardingRequest } from "../services/authService";
import { parseListField } from "../utils/profile";
import { getRandomAvatar } from "../utils/avatarPool";
import {
  REQUIRED_FIELDS,
  genderOptions,
  countryCityOptions,
  birthCountryOptions,
  educationOptions,
  hobbyOptions,
  petOptions,
} from "../constants/profileOptions";
import DropdownSelect from "../components/common/DropdownSelect";

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
    birthCountry: user?.birthCountry || "",
    birthCity: user?.birthCity || "",
    height: user?.height || "",
    education: user?.education || "",
    hobbies: parseListField(user?.hobbies),
    pets: parseListField(user?.pets),
    profilePic: user?.profilePic || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const canUploadAvatar = user?.accountType === "admin";

  const availableCities = useMemo(() => {
    return (
      countryCityOptions.find(
        (country) => country.value === formState.country
      )?.cities || []
    );
  }, [formState.country]);

  const availableBirthCities = useMemo(() => {
    return (
      birthCountryOptions.find(
        (country) => country.value === formState.birthCountry
      )?.cities || []
    );
  }, [formState.birthCountry]);

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

  const handleBirthCountrySelect = (country) => {
    const currentCities =
      birthCountryOptions.find((item) => item.value === country)?.cities || [];
    const keepCity = currentCities.includes(formState.birthCity)
      ? formState.birthCity
      : "";
    setFormState((prev) => ({
      ...prev,
      birthCountry: country,
      birthCity: keepCity,
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

  const handleAvatarUploadFromLibrary = async () => {
    if (!canUploadAvatar) return;
    setAvatarLoading(true);
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photos to upload an avatar."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        if (
          asset.base64 &&
          asset.base64.length * (3 / 4) <= 200 * 1024
        ) {
          const dataUri = `data:${asset.type || "image/jpeg"};base64,${
            asset.base64
          }`;
          setFormState((prev) => ({
            ...prev,
            profilePic: dataUri,
          }));
          setError("");
        } else {
          Alert.alert("Avatar too large", "Avatar must be under 200 KB.");
        }
      }
    } finally {
      setAvatarLoading(false);
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

        <View style={styles.avatarSection}>
          {formState.profilePic ? (
            <Image
              source={
                typeof formState.profilePic === "string"
                  ? { uri: formState.profilePic }
                  : formState.profilePic
              }
              style={styles.avatarPreview}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>No photo</Text>
            </View>
          )}
          <View style={styles.avatarActions}>
            <TouchableOpacity
              style={[
                buttonStyles.primaryButton,
                styles.avatarButton,
                avatarLoading && styles.disabledButton,
              ]}
              onPress={async () => {
                setAvatarLoading(true);
                try {
                  const randomAvatar =
                    getRandomAvatar(formState.gender) || getRandomAvatar();
                  if (randomAvatar) {
                    setFormState((prev) => ({
                      ...prev,
                      profilePic: randomAvatar,
                    }));
                    setError("");
                  } else {
                    Alert.alert(
                      "Avatar unavailable",
                      "Unable to generate avatar right now."
                    );
                  }
                } finally {
                  setAvatarLoading(false);
                }
              }}
              disabled={avatarLoading}
            >
              <Text style={buttonStyles.primaryButtonText}>
                Random avatar
              </Text>
            </TouchableOpacity>
            {canUploadAvatar && (
              <TouchableOpacity
                style={[
                  buttonStyles.secondaryOutlineButton,
                  styles.avatarButton,
                  avatarLoading && styles.disabledButton,
                ]}
                onPress={handleAvatarUploadFromLibrary}
                disabled={avatarLoading}
              >
                <Text style={buttonStyles.secondaryOutlineText}>
                  Upload photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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

        <DropdownSelect
          label="Gender*"
          value={formState.gender}
          placeholder="Select gender"
          options={genderOptions}
          onSelect={(value) => handleFieldChange("gender", value)}
        />

        <DropdownSelect
          label="Country*"
          value={formState.country}
          placeholder="Select country"
          options={countryCityOptions}
          onSelect={(value) => handleCountrySelect(value)}
        />

        <DropdownSelect
          label="City*"
          value={formState.city}
          placeholder={
            availableCities.length ? "Select city" : "Select a country first"
          }
          options={availableCities.map((city) => ({
            value: city,
            label: city,
          }))}
          onSelect={(value) => handleFieldChange("city", value)}
          disabled={!availableCities.length}
        />

        <DropdownSelect
          label="Birth country"
          value={formState.birthCountry}
          placeholder="Select birth country"
          options={birthCountryOptions}
          onSelect={(value) => handleBirthCountrySelect(value)}
        />

        <DropdownSelect
          label="Birth city"
          value={formState.birthCity}
          placeholder={
            availableBirthCities.length
              ? "Select birth city"
              : "Select a country first"
          }
          options={availableBirthCities.map((city) => ({
            value: city,
            label: city,
          }))}
          onSelect={(value) => handleFieldChange("birthCity", value)}
          disabled={!availableBirthCities.length}
        />

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

        <DropdownSelect
          label="Education"
          value={formState.education}
          placeholder="Select education"
          options={educationOptions.map((option) => ({
            value: option,
            label: option,
          }))}
          onSelect={(value) => handleFieldChange("education", value)}
        />

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
  avatarSection: {
    alignItems: "center",
    gap: 12,
  },
  avatarPreview: {
    width: 110,
    height: 110,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: BRAND_COLORS.muted,
  },
  avatarActions: {
    flexDirection: "row",
    gap: 12,
  },
  avatarButton: {
    flex: 1,
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
