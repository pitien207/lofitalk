import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import Logo from "./assets/LofiTalk_logo.png";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.100:5001/api";

const genderLabels = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  prefer_not_say: "Prefer not to say",
};

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
};

const computeAge = (value) => {
  if (!value) return "";
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return `${age}`;
};

const formatLocation = (user) => {
  const { city, country } = user || {};
  const joined = [city, country].filter(Boolean).join(", ");
  return joined;
};

const StatBadge = ({ label, value }) => (
  <View style={styles.statBadge}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value || "--"}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[
        styles.infoValue,
        !value && styles.infoValuePlaceholder,
      ]}
    >
      {value || "Not provided yet"}
    </Text>
  </View>
);

const PillList = ({ items }) => {
  if (!items.length) {
    return <Text style={styles.infoValuePlaceholder}>Not provided yet</Text>;
  }
  return (
    <View style={styles.pillRow}>
      {items.map((item) => (
        <View key={item} style={styles.pill}>
          <Text style={styles.pillText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const SectionCard = ({ title, children }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      setUser(data.user || { fullName: "Friend" });
      Alert.alert(
        "Login successful",
        `Welcome back ${data.user?.fullName || "friend"}!`
      );
      setPassword("");
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed, please try again.";
      setError(message);
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    const gender = genderLabels[user.gender] || user.gender || "";
    const location = formatLocation(user);
    const birthDate = formatDate(user.birthDate);
    const age = computeAge(user.birthDate);
    const hobbies = parseListField(user.hobbies);
    const pets = parseListField(user.pets);

    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.heroOne} />
        <View style={styles.heroTwo} />
        <ScrollView
          contentContainerStyle={styles.homeScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <Image
              source={
                user.profilePic
                  ? { uri: user.profilePic }
                  : Logo
              }
              style={styles.profileAvatar}
            />
            <View style={styles.profileText}>
              <Text style={styles.profileName}>
                {user.fullName || "Your profile"}
              </Text>
              <Text style={styles.profileLocation}>
                {location || "Add your location"}
              </Text>
              <Text style={styles.profileBio}>
                {user.bio || "Share a short bio so friends know you better."}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <StatBadge label="Gender" value={gender} />
            <StatBadge label="Age" value={age} />
            <StatBadge label="Height" value={user.height} />
          </View>

          <SectionCard title="Personal info">
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Birthday" value={birthDate} />
            <InfoRow label="Country" value={user.country} />
            <InfoRow label="City" value={user.city} />
            <InfoRow label="Education" value={user.education} />
          </SectionCard>

          <SectionCard title="Dating goal">
            <InfoRow label="Goal" value={user.datingGoal} />
          </SectionCard>

          <SectionCard title="Hobbies">
            <PillList items={hobbies} />
          </SectionCard>

          <SectionCard title="Pets">
            <PillList items={pets} />
          </SectionCard>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 16 }]}
            onPress={() => setUser(null)}
          >
            <Text style={styles.primaryButtonText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.heroOne} />
      <View style={styles.heroTwo} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.brandHeader}>
          <Image source={Logo} style={styles.logo} />
          <Text style={styles.appName}>LofiTalk</Text>
          <Text style={styles.appTagline}>
            Connect, chat and feel the vibe
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardSubtitle}>
            Use your existing LofiTalk account to continue
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#A0A6B7"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#A0A6B7"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const BRAND_COLORS = {
  background: "#0F0C1D",
  primary: "#FF5E5E",
  secondary: "#F9D1D1",
  text: "#F4F5F7",
  muted: "#A0A6B7",
  card: "rgba(16, 15, 26, 0.85)",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 32,
    justifyContent: "center",
  },
  heroOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: BRAND_COLORS.primary,
    opacity: 0.25,
    top: -60,
    right: -80,
  },
  heroTwo: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#3B1D3A",
    opacity: 0.5,
    bottom: -120,
    left: -120,
    transform: [{ rotate: "15deg" }],
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: BRAND_COLORS.text,
  },
  appTagline: {
    color: BRAND_COLORS.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: BRAND_COLORS.text,
  },
  cardSubtitle: {
    color: BRAND_COLORS.muted,
    marginTop: 6,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: BRAND_COLORS.text,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 16,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
  },
  error: {
    color: "#FEB2B2",
    marginBottom: 8,
  },
  homeScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 80,
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
  statBadge: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
  },
  statLabel: {
    color: BRAND_COLORS.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: BRAND_COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BRAND_COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: {
    color: BRAND_COLORS.muted,
    fontSize: 14,
    flex: 0.6,
    marginRight: 12,
  },
  infoValue: {
    flex: 1,
    color: BRAND_COLORS.text,
    textAlign: "right",
    fontWeight: "600",
  },
  infoValuePlaceholder: {
    color: "rgba(244, 245, 247, 0.5)",
    fontWeight: "400",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
    fontSize: 13,
  },
});
