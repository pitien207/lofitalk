import { StyleSheet, View } from "react-native";
import { BRAND_COLORS } from "../../theme/colors";

const AppBackground = () => (
  <View style={styles.container} pointerEvents="none">
    <View style={styles.heroOne} />
    <View style={styles.heroTwo} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
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
});

export default AppBackground;
