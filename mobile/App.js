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

axios.defaults.withCredentials = true;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.100:5001/api";

const MENU_ITEMS = [
  { key: "home", label: "Homepage", icon: "??" },
  { key: "friends", label: "Friends", icon: "??" },
];

const genderLabels = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  prefer_not_say: "Prefer not to say",
};

const FALLBACK_MESSAGES = [
  "Ready for a late night chat?",
  "Let's plan our next meet-up!",
  "Studying right now, join me?",
  "Sending you all the cozy vibes ✨",
];

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
  if (!user) return "";
  const { city, country, location } = user;
  const joined = [city, country].filter(Boolean).join(", ");
  return joined || location || "";
};

const normalizeFriends = (rawFriends = []) => {
  if (!Array.isArray(rawFriends)) return [];
  return rawFriends
    .map((friend, index) => {
      if (!friend) return null;

      const isObject = typeof friend === "object";
      const base = isObject
        ? friend
        : {
            _id: friend,
          };

      const fallbackName = `Friend ${index + 1}`;
      const locationText = formatLocation(base);

      const vibe = base.vibe || "Always up for a chat";
      const favoriteSong = base.favoriteSong || "Share your favorite tune";
      const hobbies =
        base.hobbies && base.hobbies.length
          ? parseListField(base.hobbies)
          : parseListField("");

      return {
        _id: base._id || `${index}`,
        fullName: base.fullName || fallbackName,
        profilePic:
          base.profilePic ||
          `https://avatar.iran.liara.run/public/${(index % 90) + 1}.png`,
        location: locationText,
        lastMessage:
          base.lastMessage ||
          FALLBACK_MESSAGES[index % FALLBACK_MESSAGES.length],
        isOnline:
          base.isOnline !== undefined ? base.isOnline : index % 2 === 0,
        vibe,
        favoriteSong,
        hobbies,
      };
    })
    .filter(Boolean);
};

const ensureFriendsData = (rawFriends) => {
  return normalizeFriends(rawFriends);
};

const fetchFriendsFromServer = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/friends`, {
      withCredentials: true,
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : undefined,
    });
    return response.data;
  } catch (error) {
    console.log("Failed to fetch friends from server:", error?.message);
    return [];
  }
};

const fetchFriendProfile = async (friendId, token) => {
  if (!friendId) return null;
  const response = await axios.get(
    `${API_BASE_URL}/users/profile/${friendId}`,
    {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
  return response.data;
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
  const [friends, setFriends] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const applyAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (data.token) {
        setAuthToken(data.token);
        applyAuthHeader(data.token);
      }

      setUser(data.user || { fullName: "Friend" });
      const serverFriends = await fetchFriendsFromServer(data.token);
      setFriends(
        ensureFriendsData(serverFriends ?? data.user?.friends)
      );
      setSelectedFriend(null);
      setFriendProfile(null);
      setActivePage("home");
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

  const handleSignOut = () => {
    setUser(null);
    setFriends([]);
    setEmail("");
    setPassword("");
    setSelectedFriend(null);
    setAuthToken(null);
    applyAuthHeader(null);
    setActivePage("home");
  };

  const resetFriendSelection = () => {
    setSelectedFriend(null);
    setFriendProfile(null);
    setProfileError(null);
    setProfileLoading(false);
  };

  const handleFriendSelect = async (friend) => {
    setSelectedFriend(friend);
    setFriendProfile(null);
    setProfileError(null);
    setProfileLoading(true);
    try {
      const profile = await fetchFriendProfile(friend._id, authToken || null);
      setFriendProfile(profile);
    } catch (err) {
      setProfileError(
        err?.response?.data?.message || "Unable to load profile right now."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleNavChange = (page) => {
    resetFriendSelection();
    setActivePage(page);
  };

  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      {MENU_ITEMS.map((item) => {
        const isActive = activePage === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.bottomNavItem,
              isActive && styles.bottomNavItemActive,
            ]}
            onPress={() => handleNavChange(item.key)}
          >
            <Text style={styles.bottomNavIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.bottomNavLabel,
                isActive && styles.bottomNavLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderHomeContent = () => {
    const gender = genderLabels[user.gender] || user.gender || "";
    const location = formatLocation(user);
    const birthDate = formatDate(user.birthDate);
    const age = computeAge(user.birthDate);
    const hobbies = parseListField(user.hobbies);
    const pets = parseListField(user.pets);

    return (
      <ScrollView
        contentContainerStyle={styles.homeScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <Image
            source={
              user.profilePic ? { uri: user.profilePic } : Logo
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
          style={[styles.primaryButton, styles.homeSignOut]}
          onPress={handleSignOut}
        >
          <Text style={styles.primaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderFriendsContent = () => (
    <ScrollView
      contentContainerStyle={styles.friendsScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.friendsHeader}>
        <View>
          <Text style={styles.friendsTitle}>
            {selectedFriend ? "Friend profile" : "Friends"}
          </Text>
          <Text style={styles.friendsSubtitle}>
            {selectedFriend
              ? "See what your friend has been up to lately."
              : "Keep the cozy conversations going just like on the web."}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.ghostButton}
          onPress={() =>
            selectedFriend ? resetFriendSelection() : handleNavChange("home")
          }
        >
          <Text style={styles.ghostButtonText}>
            {selectedFriend ? "Back to friends" : "Back to home"}
          </Text>
        </TouchableOpacity>
      </View>

      {selectedFriend ? (
        renderFriendProfile()
      ) : friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No friends yet</Text>
          <Text style={styles.emptySubtitle}>
            Send a few requests on the web app and they will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.friendList}>
          {friends.map((friend) => (
            <TouchableOpacity
              key={friend._id}
              style={styles.friendCard}
              activeOpacity={0.85}
              onPress={() => handleFriendSelect(friend)}
            >
              <View style={styles.friendAvatarWrapper}>
                <Image
                  source={
                    typeof friend.profilePic === "string"
                      ? { uri: friend.profilePic }
                      : Logo
                  }
                  style={styles.friendAvatar}
                />
                {friend.isOnline && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.friendMeta}>
                <Text style={styles.friendName}>{friend.fullName}</Text>
                <Text style={styles.friendLocation}>
                  {friend.location || "Let's keep in touch"}
                </Text>
                <Text style={styles.friendMessage} numberOfLines={1}>
                  {friend.lastMessage}
                </Text>
              </View>
              <View style={styles.friendTimeBadge}>
                <Text style={styles.friendTimeText}>Now</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderFriendProfile = () => {
    if (profileLoading) {
      return (
        <View style={styles.profileStateBox}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.profileStateText}>Loading friend profile…</Text>
        </View>
      );
    }

    if (profileError) {
      return (
        <View style={styles.profileStateBox}>
          <Text style={styles.profileStateText}>{profileError}</Text>
        </View>
      );
    }

    const profile = friendProfile || selectedFriend;
    if (!profile) return null;

    const gender = genderLabels[profile.gender] || profile.gender || "";
    const location = formatLocation(profile);
    const birthDate = formatDate(profile.birthDate);
    const age = computeAge(profile.birthDate);
    const hobbies = parseListField(profile.hobbies);
    const pets = parseListField(profile.pets);

    return (
      <View style={styles.friendProfileWrapper}>
        <View style={styles.friendProfileCard}>
          <Image
            source={
              typeof profile.profilePic === "string"
                ? { uri: profile.profilePic }
                : Logo
            }
            style={styles.friendProfileAvatar}
          />
          <Text style={styles.friendProfileName}>
            {profile.fullName || "Friend"}
          </Text>
          {age && (
            <Text style={styles.friendProfileBadge}>
              {age} yrs · {gender || "—"}
            </Text>
          )}
          <Text style={styles.friendProfileLocation}>
            {location || "Somewhere cozy"}
          </Text>
          {profile.bio && (
            <Text style={styles.friendProfileBio}>"{profile.bio}"</Text>
          )}
          <View style={styles.friendProfileActions}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryOutlineButton}>
              <Text style={styles.secondaryOutlineText}>Start call</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatBadge label="Gender" value={gender} />
          <StatBadge label="Age" value={age} />
          <StatBadge label="Height" value={profile.height} />
        </View>

        <SectionCard title="Personal info">
          <InfoRow label="Email" value={profile.email} />
          <InfoRow label="Birthday" value={birthDate} />
          <InfoRow label="Country" value={profile.country} />
          <InfoRow label="City" value={profile.city} />
          <InfoRow label="Education" value={profile.education} />
        </SectionCard>

        <SectionCard title="Dating goal">
          <InfoRow label="Goal" value={profile.datingGoal} />
        </SectionCard>

        <SectionCard title="Hobbies">
          <PillList items={hobbies} />
        </SectionCard>

        <SectionCard title="Pets">
          <PillList items={pets} />
        </SectionCard>
      </View>
    );
  };

  if (user) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.heroOne} />
        <View style={styles.heroTwo} />
        <View style={styles.mainArea}>
          {activePage === "home"
            ? renderHomeContent()
            : renderFriendsContent()}
        </View>
        {renderBottomNav()}
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
  mainArea: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 120,
  },
  bottomNav: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 32,
    backgroundColor: "rgba(16, 15, 26, 0.9)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 16,
  },
  bottomNavItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  bottomNavIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: BRAND_COLORS.secondary,
  },
  bottomNavLabel: {
    color: BRAND_COLORS.muted,
    fontWeight: "600",
    fontSize: 12,
  },
  bottomNavLabelActive: {
    color: BRAND_COLORS.text,
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
    marginTop: 40,
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
  homeSignOut: {
    marginTop: 24,
  },
  friendsScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  friendsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  friendsTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: BRAND_COLORS.text,
  },
  friendsSubtitle: {
    color: BRAND_COLORS.muted,
    marginTop: 4,
  },
  ghostButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ghostButtonText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  emptyTitle: {
    color: BRAND_COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: BRAND_COLORS.muted,
    textAlign: "center",
  },
  secondaryOutlineButton: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryOutlineText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  friendList: {
    gap: 12,
    marginTop: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  friendAvatarWrapper: {
    marginRight: 12,
  },
  friendAvatar: {
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
  friendMeta: {
    flex: 1,
  },
  friendName: {
    color: BRAND_COLORS.text,
    fontWeight: "700",
    fontSize: 16,
  },
  friendLocation: {
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  friendMessage: {
    color: BRAND_COLORS.muted,
    marginTop: 6,
  },
  friendTimeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginLeft: 12,
  },
  friendTimeText: {
    color: BRAND_COLORS.muted,
    fontWeight: "600",
    fontSize: 12,
  },
  profileStateBox: {
    backgroundColor: "rgba(16,15,26,0.6)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  profileStateText: {
    color: BRAND_COLORS.muted,
    fontWeight: "600",
    marginTop: 12,
  },
  friendProfileWrapper: {
    gap: 20,
  },
  friendProfileCard: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  friendProfileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 36,
    marginBottom: 16,
  },
  friendProfileName: {
    color: BRAND_COLORS.text,
    fontSize: 26,
    fontWeight: "700",
  },
  friendProfileBadge: {
    color: BRAND_COLORS.secondary,
    marginTop: 6,
    fontWeight: "600",
  },
  friendProfileLocation: {
    color: BRAND_COLORS.muted,
    marginTop: 8,
    marginBottom: 16,
  },
  friendProfileBio: {
    color: BRAND_COLORS.muted,
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  friendProfileActions: {
    width: "100%",
  },
  friendProfileSection: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
});
