import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const resolveImageSource = (value) => {
  if (!value) return Logo;
  if (typeof value === "string") return { uri: value };
  return value;
};

const HomeScreen = ({ user, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const gender = genderLabels[user?.gender] || user?.gender || "";
  const location = formatLocation(user);
  const birthDate = formatDate(user?.birthDate);
  const age = computeAge(user?.birthDate);
  const hobbies = parseListField(user?.hobbies);
  const pets = parseListField(user?.pets);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMenuSelect = (item) => {
    setMenuOpen(false);
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

  return (
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
            <Text style={styles.menuTriggerDots}>⋯</Text>
          </TouchableOpacity>
          {menuOpen && (
            <View style={styles.menuDropdown}>
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
});

export default HomeScreen;
