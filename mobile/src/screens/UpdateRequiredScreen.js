import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BRAND_COLORS } from "../theme/colors";
import { buttonStyles } from "../components/common/buttons";

const UpdateRequiredScreen = ({
  requiredVersion,
  currentVersion,
  updateUrl,
  onRetry,
}) => {
  const canOpenUpdate = Boolean(updateUrl);

  const handleOpenUpdate = () => {
    if (!canOpenUpdate) return;
    Linking.openURL(updateUrl).catch(() => null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>UPDATE</Text>
        </View>
        <Text style={styles.title}>Please update LofiTalk</Text>
        <Text style={styles.subtitle}>
          Your installed app is no longer supported. Install the latest build to
          continue.
        </Text>

        <View style={styles.versionBox}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Installed</Text>
            <Text style={styles.versionValue}>
              {currentVersion || "Unknown"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Required</Text>
            <Text style={styles.requiredValue}>
              {requiredVersion || "Latest"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            buttonStyles.primaryButton,
            !canOpenUpdate && styles.disabledButton,
          ]}
          onPress={handleOpenUpdate}
          disabled={!canOpenUpdate}
        >
          <Text style={buttonStyles.primaryButtonText}>
            {canOpenUpdate ? "Download update" : "Update link unavailable"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[buttonStyles.secondaryButton, styles.centeredButton]}
          onPress={onRetry}
        >
          <Text style={buttonStyles.secondaryButtonText}>Check again</Text>
        </TouchableOpacity>

        <Text style={styles.helper}>
          If the issue persists, reinstall the app using the newest APK.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,94,94,0.16)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
  },
  badgeText: {
    color: BRAND_COLORS.primary,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontSize: 12,
  },
  title: {
    color: BRAND_COLORS.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: BRAND_COLORS.muted,
    lineHeight: 20,
    marginTop: 6,
  },
  versionBox: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  versionLabel: {
    color: BRAND_COLORS.muted,
  },
  versionValue: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  requiredValue: {
    color: BRAND_COLORS.primary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  centeredButton: {
    alignSelf: "center",
  },
  helper: {
    color: BRAND_COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },
});

export default UpdateRequiredScreen;
