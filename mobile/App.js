import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import Logo from "./assets/LofiTalk_logo.png";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.100:5001/api";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      setUser(data.user || { fullName: "bạn" });
      Alert.alert(
        "Đăng nhập thành công",
        `Chào mừng ${data.user?.fullName || "bạn"}!`
      );
      setPassword("");
    } catch (err) {
      const message =
        err.response?.data?.message || "Đăng nhập thất bại, thử lại nhé.";
      setError(message);
      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.heroOne} />
        <View style={styles.heroTwo} />
        <View style={styles.homeCard}>
          <Text style={styles.homeGreeting}>
            Xin chào {user.fullName || "bạn"}!
          </Text>
          <Text style={styles.homeCopy}>
            Đây là màn hình Home tạm thời. Bạn đã đăng nhập thành công vào hệ
            thống LofiTalk.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setUser(null)}
          >
            <Text style={styles.primaryButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
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
            Kết nối cảm xúc, trò chuyện mọi lúc
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>
          <Text style={styles.cardSubtitle}>
            Sử dụng tài khoản LofiTalk hiện tại để tiếp tục
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
            placeholder="Mật khẩu"
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
              <Text style={styles.primaryButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Quên mật khẩu?</Text>
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
    backgroundColor: "rgba(16, 15, 26, 0.75)",
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
  homeCard: {
    marginHorizontal: 24,
    marginTop: 120,
    backgroundColor: "rgba(16, 15, 26, 0.85)",
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  homeGreeting: {
    fontSize: 26,
    fontWeight: "700",
    color: BRAND_COLORS.text,
    marginBottom: 12,
  },
  homeCopy: {
    color: BRAND_COLORS.muted,
    lineHeight: 20,
    marginBottom: 24,
  },
});
