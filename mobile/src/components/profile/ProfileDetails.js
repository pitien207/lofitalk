import { StyleSheet, Text, View } from "react-native";
import { BRAND_COLORS } from "../../theme/colors";

export const StatBadge = ({ label, value }) => (
  <View style={styles.statBadge}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value || "--"}</Text>
  </View>
);

export const InfoRow = ({ label, value }) => (
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

export const PillList = ({ items = [] }) => {
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

export const SectionCard = ({ title, children }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
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
