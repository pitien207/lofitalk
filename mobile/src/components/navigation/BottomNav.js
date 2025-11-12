import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BRAND_COLORS } from "../../theme/colors";

const BottomNav = ({ items, activeItem, onChange }) => (
  <View style={styles.bottomNav}>
    {items.map((item) => {
      const isActive = activeItem === item.key;
      return (
        <TouchableOpacity
          key={item.key}
          style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]}
          onPress={() => onChange(item.key)}
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

const styles = StyleSheet.create({
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
});

export default BottomNav;
