import { StyleSheet } from "react-native";
import { BRAND_COLORS } from "../../theme/colors";

export const buttonStyles = StyleSheet.create({
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
});
