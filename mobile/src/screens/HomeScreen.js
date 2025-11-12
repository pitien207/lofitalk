import {
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

const HomeScreen = ({ user, onSignOut }) => {
  const gender = genderLabels[user?.gender] || user?.gender || "";
  const location = formatLocation(user);
  const birthDate = formatDate(user?.birthDate);
  const age = computeAge(user?.birthDate);
  const hobbies = parseListField(user?.hobbies);
  const pets = parseListField(user?.pets);

  return (
    <ScrollView
      contentContainerStyle={styles.homeScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <Image
          source={
            typeof user?.profilePic === "string"
              ? { uri: user?.profilePic }
              : Logo
          }
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

      <SectionCard title="Dating goal">
        <InfoRow label="Goal" value={user?.datingGoal} />
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
  homeSignOut: {
    marginTop: 24,
  },
});

export default HomeScreen;
