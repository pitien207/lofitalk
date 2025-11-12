import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BRAND_COLORS } from "../theme/colors";
import Logo from "../../assets/LofiTalk_logo.png";
import { buttonStyles } from "../components/common/buttons";

const AuthScreen = ({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={styles.content}
    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
  >
    <View style={styles.brandHeader}>
      <Image source={Logo} style={styles.logo} />
      <Text style={styles.appName}>LofiTalk</Text>
      <Text style={styles.appTagline}>Connect, chat and feel the vibe</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Sign in</Text>
      <Text style={styles.cardSubtitle}>
        Use your existing LofiTalk account to continue
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#A0A6B7"
        value={email}
        onChangeText={onEmailChange}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#A0A6B7"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        style={styles.input}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[
          buttonStyles.primaryButton,
          loading && styles.disabledButton,
        ]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={buttonStyles.primaryButtonText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={buttonStyles.secondaryButton}>
        <Text style={buttonStyles.secondaryButtonText}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 32,
    justifyContent: "center",
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
    backgroundColor: BRAND_COLORS.card,
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
  error: {
    color: "#FEB2B2",
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AuthScreen;
