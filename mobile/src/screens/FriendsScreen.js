import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BRAND_COLORS } from "../theme/colors";
import { genderLabels } from "../constants";
import {
  computeAge,
  formatDate,
  formatLocation,
  parseListField,
} from "../utils/profile";
import { resolveImageSource } from "../utils/imageSource";
import {
  InfoRow,
  PillList,
  SectionCard,
  StatBadge,
} from "../components/profile/ProfileDetails";
import { buttonStyles } from "../components/common/buttons";

const FriendsScreen = ({
  friends = [],
  friendsLoading,
  loadingMoreFriends,
  hasMoreFriends,
  blockedUsers = [],
  blockedLoading,
  blockingUserId,
  unblockingUserId,
  reportingUserId,
  selectedFriend,
  friendProfile,
  profileLoading,
  profileError,
  onFriendSelect,
  onResetFriendSelection,
  onNavigateHome,
  onStartChat,
  onRefreshFriends,
  onLoadMoreFriends,
  onRefreshBlocked,
  onBlockUser,
  onUnblockUser,
  onReportUser,
  isBlockedUser,
}) => {
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const REPORT_WORD_LIMIT = 120;

  const closeMenu = () => setOpenMenuUserId(null);

  const handleFriendPress = (friend) => {
    closeMenu();
    onFriendSelect(friend);
  };

  const handleToggleMenu = (userId) => {
    setOpenMenuUserId((prev) => (prev === userId ? null : userId));
  };

  const openReportModal = (friend) => {
    if (!friend) return;
    closeMenu();
    setReportTarget(friend);
    setReportMessage("");
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setReportTarget(null);
    setReportMessage("");
  };

  const confirmBlockUser = (friend) => {
    if (!friend?._id || !onBlockUser) return;
    Alert.alert(
      "Block friend",
      `Block ${friend.fullName || "this friend"}? They won't be able to chat with you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => onBlockUser(friend._id),
        },
      ]
    );
  };

  const handleUnblockPress = (userId) => {
    if (!userId || !onUnblockUser) return;
    onUnblockUser(userId);
  };

  const handleReportSubmit = async () => {
    if (!reportTarget || !reportMessage.trim() || !onReportUser) return;
    const success = await onReportUser(reportTarget._id, reportMessage.trim());
    if (success) {
      Alert.alert("Đã gửi báo cáo", "Cảm ơn bạn đã phản hồi.");
      closeReportModal();
    } else {
      Alert.alert("Có lỗi xảy ra", "Không thể gửi báo cáo. Vui lòng thử lại.");
    }
  };

  const reportWordCount = reportMessage.trim()
    ? reportMessage.trim().split(/\s+/).length
    : 0;
  const isReportTooLong = reportWordCount > REPORT_WORD_LIMIT;
  const isSubmittingReport =
    reportTarget && reportingUserId === reportTarget._id;
  const canSubmitReport =
    reportMessage.trim().length > 0 && !isReportTooLong && !isSubmittingReport;

  const showProfile = Boolean(selectedFriend);
  const Header = (
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
  );

  const renderFriendItem = ({ item }) => {
    const isMenuOpen = openMenuUserId === item._id;
    const alreadyBlocked = isBlockedUser?.(item._id);
    const isProcessingBlock = blockingUserId === item._id;
    const isProcessingReport = reportingUserId === item._id;
    const locationLabel = item.location || "Let's keep in touch";

    return (
      <TouchableOpacity
        key={item._id}
        style={styles.friendCard}
        activeOpacity={0.85}
        onPress={() => handleFriendPress(item)}
      >
        <View style={styles.friendAvatarWrapper}>
          <Image
            source={resolveImageSource(item.profilePic)}
            style={styles.friendAvatar}
          />
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.friendMeta}>
          <Text style={styles.friendName}>{item.fullName}</Text>
          <Text style={styles.friendLocation}>{locationLabel}</Text>
          <Text style={styles.friendMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.friendMenuButton}
          onPress={() => handleToggleMenu(item._id)}
        >
          <Text style={styles.friendMenuButtonText}>...</Text>
        </TouchableOpacity>
        {isMenuOpen && (
          <View style={styles.friendMenu}>
            <TouchableOpacity
              style={styles.friendMenuAction}
              onPress={() => openReportModal(item)}
              disabled={isProcessingReport}
            >
              <Text style={styles.friendMenuActionText}>
                {isProcessingReport ? "Sending..." : "Report user"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.friendMenuAction,
                alreadyBlocked && styles.friendMenuActionDisabled,
              ]}
              disabled={alreadyBlocked || isProcessingBlock}
              onPress={() => {
                closeMenu();
                confirmBlockUser(item);
              }}
            >
              <Text style={styles.friendMenuActionText}>
                {isProcessingBlock
                  ? "Blocking..."
                  : alreadyBlocked
                  ? "Blocked"
                  : "Block user"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBlockedSection = () => (
    <View style={styles.blockedSection}>
      <View style={styles.blockedHeader}>
        <Text style={styles.blockedTitle}>Blocked friends</Text>
        <TouchableOpacity
          onPress={() => onRefreshBlocked?.().catch?.(() => null)}
          disabled={blockedLoading}
        >
          <Text style={styles.blockedRefresh}>
            {blockedLoading ? "Refreshing..." : "Refresh"}
          </Text>
        </TouchableOpacity>
      </View>
      {blockedUsers.length === 0 ? (
        <Text style={styles.blockedEmpty}>
          You haven't blocked anyone yet.
        </Text>
      ) : (
        <View style={styles.blockedList}>
          {blockedUsers.map((user) => {
            const isProcessing = unblockingUserId === user._id;
            return (
              <View key={user._id} style={styles.blockedCard}>
                <View style={styles.blockedInfo}>
                  <Image
                    source={resolveImageSource(user.profilePic)}
                    style={styles.blockedAvatar}
                  />
                  <View>
                    <Text style={styles.blockedName}>
                      {user.fullName || "Friend"}
                    </Text>
                    <Text style={styles.blockedLocation}>
                      {formatLocation(user) || user.location || "Unknown"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.blockedAction}
                  onPress={() => handleUnblockPress(user._id)}
                  disabled={isProcessing}
                >
                  <Text style={styles.blockedActionText}>
                    {isProcessing ? "Unblocking..." : "Unblock"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View>
      {loadingMoreFriends ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loaderText}>Loading more friends...</Text>
        </View>
      ) : null}
      {renderBlockedSection()}
    </View>
  );

  return (
    <>
      {showProfile ? (
        <ScrollView
          contentContainerStyle={styles.friendsScroll}
          showsVerticalScrollIndicator={false}
        >
          {Header}
          <FriendProfile
            profile={friendProfile || selectedFriend}
            loading={profileLoading}
            error={profileError}
            onStartChat={onStartChat}
          />
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {Header}
          <FlatList
            data={friends}
            keyExtractor={(item) => item._id}
            renderItem={renderFriendItem}
            contentContainerStyle={
              friends.length === 0
                ? [styles.friendsScroll, styles.emptyListContainer]
                : styles.listContent
            }
            ListEmptyComponent={
              friendsLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.emptySubtitle}>Loading friends...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Send a few requests on the web app and they will appear here.
                  </Text>
                </View>
              )
            }
            onEndReachedThreshold={0.25}
            onEndReached={() => {
              if (friends.length && hasMoreFriends) {
                onLoadMoreFriends?.().catch?.(() => null);
              }
            }}
            onScrollBeginDrag={closeMenu}
            refreshing={friendsLoading}
            onRefresh={() => onRefreshFriends?.().catch?.(() => null)}
            ItemSeparatorComponent={() => <View style={styles.friendSeparator} />}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
      {reportModalVisible && (
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <Text style={styles.reportTitle}>Báo cáo người dùng</Text>
            <Text style={styles.reportSubtitle}>
              Hãy mô tả ngắn gọn (tối đa {REPORT_WORD_LIMIT} từ)
            </Text>
            <Text style={styles.reportTarget}>
              {reportTarget?.fullName || "Người dùng"}
            </Text>
            <TextInput
              style={styles.reportInput}
              multiline
              placeholder="Ví dụ: Gửi tin nhắn không phù hợp..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={reportMessage}
              onChangeText={setReportMessage}
            />
            <Text
              style={[
                styles.reportCounter,
                isReportTooLong && styles.reportCounterError,
              ]}
            >
              {reportWordCount}/{REPORT_WORD_LIMIT}
            </Text>
            <View style={styles.reportActions}>
              <TouchableOpacity
                style={[styles.reportButton, styles.reportCancel]}
                onPress={closeReportModal}
                disabled={isSubmittingReport}
              >
                <Text style={styles.reportCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reportButton,
                  canSubmitReport ? styles.reportSubmit : styles.reportSubmitDisabled,
                ]}
                onPress={handleReportSubmit}
                disabled={!canSubmitReport}
              >
                {isSubmittingReport && (
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.reportSubmitText}>Gửi báo cáo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
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
  const avatarSource = resolveImageSource(profile.profilePic);
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
        <Image source={avatarSource} style={styles.friendProfileAvatar} />
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
  listContainer: {
    flex: 1,
  },
  friendsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
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
  friendSeparator: {
    height: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    position: "relative",
    overflow: "visible",
  },
  friendAvatarWrapper: {
    marginRight: 12,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  friendMenuButton: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  friendMenuButtonText: {
    color: BRAND_COLORS.muted,
    fontWeight: "800",
    fontSize: 16,
  },
  friendMenu: {
    position: "absolute",
    top: 48,
    right: 12,
    backgroundColor: "rgba(16,15,26,0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  friendMenuAction: {
    paddingVertical: 2,
  },
  friendMenuActionDisabled: {
    opacity: 0.5,
  },
  friendMenuActionText: {
    color: "#ff8c8c",
    fontWeight: "700",
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
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loaderText: {
    color: BRAND_COLORS.muted,
    fontWeight: "600",
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
  blockedSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  blockedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  blockedTitle: {
    color: BRAND_COLORS.text,
    fontWeight: "700",
    fontSize: 16,
  },
  blockedRefresh: {
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
  },
  blockedList: {
    marginTop: 8,
  },
  blockedCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  blockedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  blockedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  blockedName: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  blockedLocation: {
    color: BRAND_COLORS.muted,
    fontSize: 12,
  },
  blockedEmpty: {
    color: BRAND_COLORS.muted,
    fontStyle: "italic",
    marginTop: 12,
  },
  blockedAction: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  blockedActionText: {
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
  },
  reportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  reportModal: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: BRAND_COLORS.background,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
  },
  reportTitle: {
    color: BRAND_COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  reportSubtitle: {
    color: BRAND_COLORS.muted,
    marginTop: 6,
    fontSize: 13,
  },
  reportTarget: {
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
    marginTop: 8,
  },
  reportInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 12,
    color: BRAND_COLORS.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
  reportCounter: {
    marginTop: 8,
    textAlign: "right",
    color: BRAND_COLORS.muted,
    fontSize: 12,
  },
  reportCounterError: {
    color: "#ff8c8c",
  },
  reportActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  reportButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  reportCancel: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  reportCancelText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  reportSubmit: {
    backgroundColor: BRAND_COLORS.secondary,
  },
  reportSubmitDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  reportSubmitText: {
    color: "#1f1f1f",
    fontWeight: "700",
  },
});

export default FriendsScreen;
