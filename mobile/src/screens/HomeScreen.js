import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import Logo from "../../assets/LofiTalk_logo.png";
import { BRAND_COLORS } from "../theme/colors";
import { genderLabels } from "../constants";
import {
  computeAge,
  formatDate,
  formatLocation,
  parseListField,
} from "../utils/profile";
import {
  InfoRow,
  PillList,
  SectionCard,
  StatBadge,
} from "../components/profile/ProfileDetails";
import { buttonStyles } from "../components/common/buttons";
import {
  updatePasswordRequest,
  completeOnboardingRequest,
} from "../services/authService";
import { getRandomAvatar } from "../utils/avatarPool";
import * as ImagePicker from "expo-image-picker";
import {
  REQUIRED_FIELDS,
  genderOptions,
  countryCityOptions,
  educationOptions,
  hobbyOptions,
  petOptions,
} from "../constants/profileOptions";

const resolveImageSource = (value) => {
  if (!value) return Logo;
  if (typeof value === "string") return { uri: value };
  return value;
};

const buildProfileFormState = (baseUser = {}) => ({
  fullName: baseUser?.fullName || "",
  bio: baseUser?.bio || "",
  gender: baseUser?.gender || "",
  birthDate: baseUser?.birthDate
    ? new Date(baseUser.birthDate).toISOString().slice(0, 10)
    : "",
  country: baseUser?.country || "",
  city: baseUser?.city || "",
  height: baseUser?.height || "",
  education: baseUser?.education || "",
  hobbies: parseListField(baseUser?.hobbies),
  pets: parseListField(baseUser?.pets),
  profilePic: baseUser?.profilePic || "",
});

const serializeProfilePayload = (formState) => ({
  fullName: formState.fullName || "",
  bio: formState.bio || "",
  gender: formState.gender || "",
  birthDate: formState.birthDate || "",
  country: formState.country || "",
  city: formState.city || "",
  height: formState.height || "",
  education: formState.education || "",
  hobbies: Array.isArray(formState.hobbies)
    ? formState.hobbies.join(", ")
    : formState.hobbies || "",
  pets: Array.isArray(formState.pets)
    ? formState.pets.join(", ")
    : formState.pets || "",
  profilePic: formState.profilePic || "",
});

const HomeScreen = ({ user, onSignOut, onProfileUpdate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileForm, setProfileForm] = useState(() => buildProfileFormState(user));
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const gender = genderLabels[user?.gender] || user?.gender || "";
  const location = formatLocation(user);
  const birthDate = formatDate(user?.birthDate);
  const age = computeAge(user?.birthDate);
  const hobbies = parseListField(user?.hobbies);
  const pets = parseListField(user?.pets);
  const availableCities = useMemo(() => {
    return (
      countryCityOptions.find(
        (country) => country.value === profileForm.country
      )?.cities || []
    );
  }, [profileForm.country]);

  useEffect(() => {
    if (!editModalVisible) {
      setProfileForm(buildProfileFormState(user));
    }
  }, [user, editModalVisible]);

  const openProfileEditor = () => {
    setProfileForm(buildProfileFormState(user));
    setProfileError("");
    setPasswordError("");
    setPasswordMessage("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setEditModalVisible(true);
  };

  const closeProfileEditor = () => {
    setEditModalVisible(false);
    setProfileError("");
    setProfileForm(buildProfileFormState(user));
    setPasswordError("");
    setPasswordMessage("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileError("");
  };

  const handleProfileCountrySelect = (country) => {
    const currentCities =
      countryCityOptions.find((item) => item.value === country)?.cities || [];
    const keepCity = currentCities.includes(profileForm.city)
      ? profileForm.city
      : "";
    setProfileForm((prev) => ({
      ...prev,
      country,
      city: keepCity,
    }));
    setProfileError("");
  };

  const toggleProfileMultiValue = (field, value) => {
    setProfileForm((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
    setProfileError("");
  };

  const isRequiredFieldFilled = (field) => {
    const value = profileForm[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Boolean(value && value.toString().trim());
  };

  const handleProfileAvatarRandomLocal = () => {
    const avatar =
      getRandomAvatar(profileForm.gender || user?.gender) || getRandomAvatar();
    if (!avatar) {
      Alert.alert("Avatar unavailable", "Please try again in a moment.");
      return;
    }
    setProfileForm((prev) => ({ ...prev, profilePic: avatar }));
  };

  const handleProfileAvatarUploadLocal = async () => {
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
      if (asset.base64) {
        const dataUri = `data:${asset.type || "image/jpeg"};base64,${
          asset.base64
        }`;
        setProfileForm((prev) => ({ ...prev, profilePic: dataUri }));
      }
    }
  };

  const handleProfileSubmit = async () => {
    const missingFields = REQUIRED_FIELDS.filter(
      (field) => !isRequiredFieldFilled(field)
    );

    if (missingFields.length > 0) {
      setProfileError("Please fill in all required fields.");
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const payload = serializeProfilePayload(profileForm);
      const response = await completeOnboardingRequest(payload);
      if (response?.user) {
        onProfileUpdate?.(response.user);
        setProfileForm(buildProfileFormState(response.user));
        setEditModalVisible(false);
        Alert.alert("Profile updated", "Your details have been saved.");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Unable to update profile at the moment.";
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMenuSelect = (item) => {
    setMenuOpen(false);
    if (item === "edit") {
      openProfileEditor();
      return;
    }
    if (item === "signout") {
      onSignOut();
      return;
    }

    const messages = {
      language: "Language settings will be available soon.",
      about: "LofiTalk mobile beta 1.0. Stay tuned for more updates.",
    };

    Alert.alert("LofiTalk", messages[item]);
  };

  const handleAvatarUpdate = async (profilePic) => {
    if (!profilePic) return;

    setAvatarLoading(true);
    setAvatarError("");
    setAvatarMessage("");
    try {
      const payload = serializeProfilePayload({
        ...profileForm,
        profilePic,
      });
      const response = await completeOnboardingRequest(payload);
      if (response?.user) {
        onProfileUpdate?.(response.user);
        setAvatarMessage("Avatar updated!");
        setProfileForm(buildProfileFormState(response.user));
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Unable to update avatar at the moment.";
      setAvatarError(message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRandomAvatar = async () => {
    const avatar = getRandomAvatar(user?.gender) || getRandomAvatar();
    if (!avatar) {
      Alert.alert("Avatar unavailable", "Please try again in a moment.");
      return;
    }
    await handleAvatarUpdate(avatar);
  };

  const handleUploadAvatar = async () => {
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
      if (asset.base64) {
        const dataUri = `data:${asset.type || "image/jpeg"};base64,${
          asset.base64
        }`;
        await handleAvatarUpdate(dataUri);
      }
    }
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPasswordError("");
    setPasswordMessage("");
  };

  const handlePasswordSubmit = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      await updatePasswordRequest({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage("Password updated successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      Alert.alert("Success", "Password updated successfully.");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Unable to update password. Please try again.";
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <ScrollView
      contentContainerStyle={styles.homeScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.homeHeader}>
        <Text style={styles.homeTitle}>LofiTalk</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuTrigger}
            onPress={toggleMenu}
            activeOpacity={0.7}
          >
            <Text style={styles.menuTriggerDots}>⋮</Text>
          </TouchableOpacity>
          {menuOpen && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuSelect("edit")}
              >
                <Text style={styles.menuItemText}>Edit profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuSelect("language")}
              >
                <Text style={styles.menuItemText}>Language</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuSelect("about")}
              >
                <Text style={styles.menuItemText}>About</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuSelect("signout")}
              >
                <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                  Sign out
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.profileCard}>
        <Image
          source={resolveImageSource(user?.profilePic)}
          style={styles.profileAvatar}
        />
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{user?.fullName || "Your profile"}</Text>
          <Text style={styles.profileLocation}>
            {location || "Add your location"}
          </Text>
          <Text style={styles.profileBio}>
            {user?.bio || "Share a short bio so friends know you better."}
          </Text>
          <View style={styles.avatarActionRow}>
            <TouchableOpacity
              style={[
                buttonStyles.primaryButton,
                styles.avatarActionButton,
                avatarLoading && styles.disabledButton,
              ]}
              onPress={handleRandomAvatar}
              disabled={avatarLoading}
            >
              <Text style={buttonStyles.primaryButtonText}>Random avatar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                buttonStyles.secondaryOutlineButton,
                styles.avatarActionButton,
                avatarLoading && styles.disabledButton,
              ]}
              onPress={handleUploadAvatar}
              disabled={avatarLoading}
            >
              <Text style={buttonStyles.secondaryOutlineText}>
                Upload photo
              </Text>
            </TouchableOpacity>
          </View>
          {avatarError ? <Text style={styles.error}>{avatarError}</Text> : null}
          {avatarMessage ? (
            <Text style={styles.avatarSuccess}>{avatarMessage}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.statRow}>
        <StatBadge label="Gender" value={gender} />
        <StatBadge label="Age" value={age} />
        <StatBadge label="Height" value={user?.height} />
      </View>

      <SectionCard title="Personal info">
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Birthday" value={birthDate} />
        <InfoRow label="Country" value={user?.country} />
        <InfoRow label="City" value={user?.city} />
        <InfoRow label="Education" value={user?.education} />
      </SectionCard>

      <SectionCard title="Hobbies">
        <PillList items={hobbies} />
      </SectionCard>

      <SectionCard title="Pets">
        <PillList items={pets} />
      </SectionCard>

      <TouchableOpacity
        style={[buttonStyles.primaryButton, styles.homeSignOut]}
        onPress={onSignOut}
      >
        <Text style={buttonStyles.primaryButtonText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={editModalVisible}
        onRequestClose={closeProfileEditor}
      >
        <View style={styles.editModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.editModalWrapper}
          >
            <View style={styles.editModalCard}>
              <View style={styles.editHeader}>
                <Text style={styles.editTitle}>Edit profile</Text>
                <TouchableOpacity
                  style={styles.editCloseButton}
                  onPress={closeProfileEditor}
                >
                  <Text style={styles.editCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.editScroll}
                contentContainerStyle={styles.editScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.editAvatarSection}>
                  {profileForm.profilePic || user?.profilePic ? (
                    <Image
                      source={resolveImageSource(
                        profileForm.profilePic || user?.profilePic
                      )}
                      style={styles.editAvatarPreview}
                    />
                  ) : (
                    <View style={styles.editAvatarPlaceholder}>
                      <Text style={styles.editAvatarPlaceholderText}>
                        Add avatar
                      </Text>
                    </View>
                  )}
                  <View style={styles.editAvatarActions}>
                    <TouchableOpacity
                      style={[buttonStyles.primaryButton, styles.editAvatarButton]}
                      onPress={handleProfileAvatarRandomLocal}
                    >
                      <Text style={buttonStyles.primaryButtonText}>
                        Random avatar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        buttonStyles.secondaryOutlineButton,
                        styles.editAvatarButton,
                      ]}
                      onPress={handleProfileAvatarUploadLocal}
                    >
                      <Text style={buttonStyles.secondaryOutlineText}>
                        Upload photo
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  placeholder="Full name / Nickname"
                  placeholderTextColor="#A0A6B7"
                  value={profileForm.fullName}
                  onChangeText={(value) => handleProfileFieldChange("fullName", value)}
                  style={styles.editInput}
                />

                <TextInput
                  placeholder="Short bio"
                  placeholderTextColor="#A0A6B7"
                  value={profileForm.bio}
                  onChangeText={(value) => handleProfileFieldChange("bio", value)}
                  style={[styles.editInput, styles.editTextArea]}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.editSectionLabel}>Gender*</Text>
                <View style={styles.editChipRow}>
                  {genderOptions.map((option) => {
                    const active = profileForm.gender === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.editChip, active && styles.editChipActive]}
                        onPress={() =>
                          handleProfileFieldChange("gender", option.value)
                        }
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.editSectionLabel}>Country*</Text>
                <View style={styles.editChipRow}>
                  {countryCityOptions.map((option) => {
                    const active = profileForm.country === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.editChip, active && styles.editChipActive]}
                        onPress={() => handleProfileCountrySelect(option.value)}
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.editSectionLabel}>City*</Text>
                <View style={styles.editChipRow}>
                  {availableCities.length === 0 ? (
                    <Text style={styles.editHelperText}>
                      Select a country to see cities.
                    </Text>
                  ) : (
                    availableCities.map((city) => {
                      const active = profileForm.city === city;
                      return (
                        <TouchableOpacity
                          key={city}
                          style={[styles.editChip, active && styles.editChipActive]}
                          onPress={() => handleProfileFieldChange("city", city)}
                        >
                          <Text
                            style={[
                              styles.editChipText,
                              active && styles.editChipTextActive,
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
                  value={profileForm.birthDate}
                  onChangeText={(value) => handleProfileFieldChange("birthDate", value)}
                  style={styles.editInput}
                />

                <TextInput
                  placeholder="Height"
                  placeholderTextColor="#A0A6B7"
                  value={profileForm.height}
                  onChangeText={(value) => handleProfileFieldChange("height", value)}
                  style={styles.editInput}
                />

                <Text style={styles.editSectionLabel}>Education</Text>
                <View style={styles.editChipRow}>
                  {educationOptions.map((option) => {
                    const active = profileForm.education === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.editChip, active && styles.editChipActive]}
                        onPress={() => handleProfileFieldChange("education", option)}
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.editSectionLabel}>Hobbies</Text>
                <View style={styles.editChipRow}>
                  {hobbyOptions.map((option) => {
                    const active = profileForm.hobbies.includes(option);
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.editChip, active && styles.editChipActive]}
                        onPress={() => toggleProfileMultiValue("hobbies", option)}
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.editSectionLabel}>Pets</Text>
                <View style={styles.editChipRow}>
                  {petOptions.map((option) => {
                    const active = profileForm.pets.includes(option);
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.editChip, active && styles.editChipActive]}
                        onPress={() => toggleProfileMultiValue("pets", option)}
                      >
                        <Text
                          style={[
                            styles.editChipText,
                            active && styles.editChipTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.passwordCard}>
                  <Text style={styles.passwordTitle}>Change password</Text>
                  <Text style={styles.passwordSubtitle}>
                    Keep your account secure by updating it regularly.
                  </Text>

                  <TextInput
                    placeholder="Current password"
                    placeholderTextColor="#A0A6B7"
                    style={styles.passwordInput}
                    secureTextEntry
                    value={passwordForm.currentPassword}
                    onChangeText={(value) =>
                      handlePasswordFieldChange("currentPassword", value)
                    }
                  />
                  <TextInput
                    placeholder="New password"
                    placeholderTextColor="#A0A6B7"
                    style={styles.passwordInput}
                    secureTextEntry
                    value={passwordForm.newPassword}
                    onChangeText={(value) =>
                      handlePasswordFieldChange("newPassword", value)
                    }
                  />
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor="#A0A6B7"
                    style={styles.passwordInput}
                    secureTextEntry
                    value={passwordForm.confirmPassword}
                    onChangeText={(value) =>
                      handlePasswordFieldChange("confirmPassword", value)
                    }
                  />
                  {passwordError ? (
                    <Text style={styles.error}>{passwordError}</Text>
                  ) : null}
                  {passwordMessage ? (
                    <Text style={styles.passwordSuccess}>{passwordMessage}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      buttonStyles.primaryButton,
                      passwordLoading && styles.disabledButton,
                    ]}
                    onPress={handlePasswordSubmit}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={buttonStyles.primaryButtonText}>
                        Update password
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {profileError ? (
                  <Text style={styles.error}>{profileError}</Text>
                ) : null}

                <View style={styles.editActionRow}>
                  <TouchableOpacity
                    style={[
                      buttonStyles.secondaryOutlineButton,
                      styles.editActionButton,
                    ]}
                    onPress={closeProfileEditor}
                    disabled={profileLoading}
                  >
                    <Text style={buttonStyles.secondaryOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      buttonStyles.primaryButton,
                      styles.editActionButton,
                      profileLoading && styles.disabledButton,
                    ]}
                    onPress={handleProfileSubmit}
                    disabled={profileLoading}
                  >
                    {profileLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={buttonStyles.primaryButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  homeScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  homeHeader: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  homeTitle: {
    color: BRAND_COLORS.text,
    fontSize: 28,
    fontWeight: "700",
  },
  menuContainer: {
    position: "relative",
    zIndex: 10,
  },
  menuTrigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTriggerDots: {
    color: BRAND_COLORS.text,
    fontSize: 24,
    marginTop: -4,
  },
  menuDropdown: {
    position: "absolute",
    top: 44,
    right: 0,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 20,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  menuItemDanger: {
    color: BRAND_COLORS.primary,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  editModalWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  editModalCard: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    maxHeight: "90%",
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  editTitle: {
    color: BRAND_COLORS.text,
    fontSize: 22,
    fontWeight: "700",
  },
  editCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  editCloseText: {
    color: BRAND_COLORS.text,
    fontSize: 18,
  },
  editScroll: {
    marginTop: 8,
  },
  editScrollContent: {
    paddingBottom: 32,
    gap: 12,
  },
  editAvatarSection: {
    alignItems: "center",
    gap: 12,
  },
  editAvatarPreview: {
    width: 110,
    height: 110,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  editAvatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarPlaceholderText: {
    color: BRAND_COLORS.muted,
  },
  editAvatarActions: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  editAvatarButton: {
    flex: 1,
    alignSelf: "stretch",
  },
  editInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: BRAND_COLORS.text,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  editTextArea: {
    height: 100,
    textAlignVertical: "top",
  },
  editSectionLabel: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  editChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  editChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  editChipActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  editChipText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  editChipTextActive: {
    color: "#0F0C1D",
  },
  editHelperText: {
    color: BRAND_COLORS.muted,
  },
  editActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editActionButton: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  profileAvatar: {
    width: 86,
    height: 86,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  profileText: {
    flex: 1,
    marginLeft: 16,
  },
  avatarActionRow: {
    flexDirection: "column",
    gap: 12,
    marginTop: 12,
    width: "100%",
  },
  avatarActionButton: {
    flex: 1,
    alignSelf: "stretch",
  },
  avatarSuccess: {
    color: "#9AE6B4",
    marginTop: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: BRAND_COLORS.text,
  },
  profileLocation: {
    marginTop: 4,
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
  },
  profileBio: {
    marginTop: 8,
    color: BRAND_COLORS.muted,
    lineHeight: 18,
  },
  statRow: {
    flexDirection: "row",
    marginTop: 20,
    marginHorizontal: -6,
  },
  homeSignOut: {
    marginTop: 24,
  },
  passwordCard: {
    marginTop: 24,
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  passwordTitle: {
    color: BRAND_COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  passwordSubtitle: {
    color: BRAND_COLORS.muted,
    fontSize: 14,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: BRAND_COLORS.text,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  passwordSuccess: {
    color: "#9AE6B4",
    marginBottom: 4,
  },
});

export default HomeScreen;
