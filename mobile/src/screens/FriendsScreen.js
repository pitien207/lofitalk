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

const FriendsScreen = ({
  friends = [],
  selectedFriend,
  friendProfile,
  profileLoading,
  profileError,
  onFriendSelect,
  onResetFriendSelection,
  onNavigateHome,
  onStartChat,
}) => {
  const showProfile = Boolean(selectedFriend);

  return (
    <ScrollView
      contentContainerStyle={styles.friendsScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.friendsHeader}>
        <View>
          <Text style={styles.friendsTitle}>
            {showProfile ? "Friend profile" : "Friends"}
          </Text>
          {showProfile && (
            <Text style={styles.friendsSubtitle}>
              See what your friend has been up to lately.
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.ghostButton}
          onPress={() =>
            showProfile ? onResetFriendSelection() : onNavigateHome()
          }
        >
          <Text style={styles.ghostButtonIcon}>{"<"}</Text>
          <Text style={styles.ghostButtonText}>
            {showProfile ? "Back to friends" : "Back to home"}
          </Text>
        </TouchableOpacity>
      </View>

      {showProfile ? (
        <FriendProfile
          profile={friendProfile || selectedFriend}
          loading={profileLoading}
          error={profileError}
          onStartChat={onStartChat}
        />
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
              onPress={() => onFriendSelect(friend)}
            >
              <View style={styles.friendAvatarWrapper}>
                <Image
                  source={resolveImageSource(friend.profilePic)}
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
};
const FriendProfile = ({ profile, loading, error, onStartChat }) => {
  if (loading) {
    return (
      <View style={styles.profileStateBox}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.profileStateText}>Loading friend profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.profileStateBox}>
        <Text style={styles.profileStateText}>{error}</Text>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const gender = genderLabels[profile.gender] || profile.gender || "";
  const location = formatLocation(profile);
  const birthDate = formatDate(profile.birthDate);
  const age = computeAge(profile.birthDate);
  const hobbies = parseListField(profile.hobbies);
  const pets = parseListField(profile.pets);
  const badgeParts = [];
  if (age) badgeParts.push(`${age} yrs`);
  if (gender) badgeParts.push(gender);

  return (
    <View style={styles.friendProfileWrapper}>
      <View style={styles.friendProfileCard}>
          <Image
            source={resolveImageSource(profile.profilePic)}
            style={styles.friendProfileAvatar}
          />
        <Text style={styles.friendProfileName}>
          {profile.fullName || "Friend"}
        </Text>
        {badgeParts.length > 0 && (
          <Text style={styles.friendProfileBadge}>
            {badgeParts.join(" | ")}
          </Text>
        )}
        <Text style={styles.friendProfileLocation}>
          {location || "Somewhere cozy"}
        </Text>
        {profile.bio && (
          <Text style={styles.friendProfileBio}>"{profile.bio}"</Text>
        )}
        <View style={styles.friendProfileActions}>
          <TouchableOpacity
            style={buttonStyles.primaryButton}
            onPress={() => onStartChat?.(profile._id)}
          >
            <Text style={buttonStyles.primaryButtonText}>Message</Text>
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

      <SectionCard title="Hobbies">
        <PillList items={hobbies} />
      </SectionCard>

      <SectionCard title="Pets">
        <PillList items={pets} />
      </SectionCard>
    </View>
  );
};

const styles = StyleSheet.create({
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
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  ghostButtonIcon: {
    color: BRAND_COLORS.secondary,
    fontSize: 14,
    marginRight: 6,
    marginTop: -1,
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
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    marginTop: 20,
    marginHorizontal: -6,
  },
});

export default FriendsScreen;
