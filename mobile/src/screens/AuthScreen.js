import { useMemo, useState } from "react";
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
import { BRAND_COLORS } from "../theme/colors";
import Logo from "../../assets/LofiTalk_logo.png";
import { buttonStyles } from "../components/common/buttons";
import {
  signupRequest,
  verifySignupCodeRequest,
} from "../services/authService";

const AuthScreen = ({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onLogin,
}) => {
  const [mode, setMode] = useState("signin");
  const [signupStep, setSignupStep] = useState("form");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const resetSignupState = () => {
    setSignupStep("form");
    setVerificationCode("");
    setSignupError("");
    setInfoMessage("");
    setPendingEmail("");
    setPendingPassword("");
    setFullName("");
    setConfirmPassword("");
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === "signin") {
      resetSignupState();
    }
  };

  const openForgotPassword = () => {
    setForgotVisible(true);
    setResetStep("request");
    setResetEmail(email || "");
    setResetCode("");
    setResetNewPassword("");
    setResetError("");
    setResetMessage("");
  };

  const closeForgotPassword = () => {
    setForgotVisible(false);
    setResetLoading(false);
    setResetError("");
    setResetMessage("");
  };

  const handleSignIn = async () => {
    if (loading) return;
    await onLogin();
  };

  const handleSignup = async () => {
    if (!fullName.trim()) {
      setSignupError("Please enter your full name or nickname.");
      return;
    }
    if (!email || !password) {
      setSignupError("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    setSignupLoading(true);
    setSignupError("");

    try {
      const response = await signupRequest({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      setSignupStep("verify");
      setPendingEmail(email.trim());
      setPendingPassword(password);
      setInfoMessage(
        response?.message ||
          "We sent a 6-digit verification code to your email."
      );
      Alert.alert(
        "Check your email",
        "Enter the verification code to activate your account."
      );
    } catch (err) {
      const message =
        err?.response?.data?.message || "Unable to sign up right now.";
      setSignupError(message);
    } finally {
      setSignupLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!pendingEmail || !pendingPassword) {
      setSignupError("Please submit the sign up form again.");
      setSignupStep("form");
      return;
    }
    if (!verificationCode.trim()) {
      setSignupError("Please enter the verification code.");
      return;
    }

    setSignupLoading(true);
    setSignupError("");

    try {
      await verifySignupCodeRequest({
        email: pendingEmail,
        code: verificationCode.trim(),
      });

      onEmailChange(pendingEmail);
      onPasswordChange(pendingPassword);

      const result = await onLogin();
      if (result) {
        Alert.alert("Account verified", "Welcome to LofiTalk!");
        resetSignupState();
        setMode("signin");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Invalid or expired code. Please try again.";
      setSignupError(message);
    } finally {
      setSignupLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!resetEmail.trim()) {
      setResetError("Please enter your email.");
      return;
    }
    setResetLoading(true);
    setResetError("");
    setResetMessage("");
    try {
      const response = await requestPasswordReset({
        email: resetEmail.trim(),
      });
      setResetMessage(
        response?.message || "Verification code sent. Check your email."
      );
      setResetStep("verify");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Unable to send reset code right now.";
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim() || !resetNewPassword.trim()) {
      setResetError("Please enter the verification code and new password.");
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetError("New password must be at least 6 characters.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetMessage("");
    try {
      await resetPasswordWithCode({
        email: resetEmail.trim(),
        code: resetCode.trim(),
        newPassword: resetNewPassword,
      });
      Alert.alert(
        "Password updated",
        "You can now sign in with your new password."
      );
      closeForgotPassword();
      setMode("signin");
      onEmailChange(resetEmail.trim());
      onPasswordChange("");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Unable to reset password. Please try again.";
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  };

  const modeTitle = useMemo(() => {
    if (mode === "signup") {
      return signupStep === "form" ? "Create account" : "Verify email";
    }
    return "Sign in";
  }, [mode, signupStep]);

  const modeSubtitle = useMemo(() => {
    if (mode === "signup") {
      return signupStep === "form"
        ? "Join LofiTalk and start cozy conversations."
        : `Enter the code sent to ${pendingEmail || "your email"}.`;
    }
    return "Use your existing LofiTalk account to continue";
  }, [mode, signupStep, pendingEmail]);

  const renderSignInForm = () => (
    <>
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
        style={[buttonStyles.primaryButton, loading && styles.disabledButton]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={buttonStyles.primaryButtonText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={buttonStyles.secondaryButton}
        onPress={openForgotPassword}
      >
        <Text style={buttonStyles.secondaryButtonText}>Forgot password?</Text>
      </TouchableOpacity>
    </>
  );

  const renderSignupForm = () => (
    <>
      <TextInput
        placeholder="Full name / Nickname"
        placeholderTextColor="#A0A6B7"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

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

      <TextInput
        placeholder="Confirm password"
        placeholderTextColor="#A0A6B7"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      {signupError && <Text style={styles.error}>{signupError}</Text>}
      {infoMessage && <Text style={styles.info}>{infoMessage}</Text>}

      <TouchableOpacity
        style={[
          buttonStyles.primaryButton,
          signupLoading && styles.disabledButton,
        ]}
        onPress={handleSignup}
        disabled={signupLoading}
      >
        {signupLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={buttonStyles.primaryButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderVerifyStep = () => (
    <>
      <View style={styles.infoBox}>
        <Text style={styles.info}>
          We sent a 6-digit code to{" "}
          <Text style={styles.boldText}>{pendingEmail}</Text>.
        </Text>
      </View>

      <TextInput
        placeholder="Verification code"
        placeholderTextColor="#A0A6B7"
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
        style={styles.input}
        maxLength={6}
      />

      {signupError && <Text style={styles.error}>{signupError}</Text>}
      {infoMessage && <Text style={styles.info}>{infoMessage}</Text>}

      <TouchableOpacity
        style={buttonStyles.secondaryButton}
        onPress={() => setSignupStep("form")}
        disabled={signupLoading}
      >
        <Text style={buttonStyles.secondaryButtonText}>Edit email</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          buttonStyles.primaryButton,
          signupLoading && styles.disabledButton,
        ]}
        onPress={handleVerifyCode}
        disabled={signupLoading}
      >
        {signupLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={buttonStyles.primaryButtonText}>Verify & sign in</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
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
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "signin" && styles.modeActive]}
            onPress={() => handleModeChange("signin")}
          >
            <Text
              style={[
                styles.modeText,
                mode === "signin" && styles.modeTextActive,
              ]}
            >
              Sign in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === "signup" && styles.modeActive]}
            onPress={() => handleModeChange("signup")}
          >
            <Text
              style={[
                styles.modeText,
                mode === "signup" && styles.modeTextActive,
              ]}
            >
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>{modeTitle}</Text>
        <Text style={styles.cardSubtitle}>{modeSubtitle}</Text>

        {mode === "signin"
          ? renderSignInForm()
          : signupStep === "form"
          ? renderSignupForm()
        : renderVerifyStep()}
      </View>
      {forgotVisible && (
        <View style={styles.forgotOverlay}>
          <View style={styles.forgotCard}>
            <Text style={styles.forgotTitle}>Reset password</Text>
            <Text style={styles.forgotSubtitle}>
              Enter your email to receive a verification code. Then set a new
              password.
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#A0A6B7"
              value={resetEmail}
              onChangeText={(value) => {
                setResetEmail(value);
                setResetError("");
                setResetMessage("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              editable={resetStep === "request"}
            />

            {resetStep === "verify" && (
              <>
                <TextInput
                  placeholder="Verification code"
                  placeholderTextColor="#A0A6B7"
                  value={resetCode}
                  onChangeText={(value) => {
                    setResetCode(value);
                    setResetError("");
                  }}
                  keyboardType="number-pad"
                  style={styles.input}
                  maxLength={6}
                />
                <TextInput
                  placeholder="New password"
                  placeholderTextColor="#A0A6B7"
                  value={resetNewPassword}
                  onChangeText={(value) => {
                    setResetNewPassword(value);
                    setResetError("");
                  }}
                  secureTextEntry
                  style={styles.input}
                />
              </>
            )}

            {resetError ? <Text style={styles.error}>{resetError}</Text> : null}
            {resetMessage ? (
              <Text style={styles.info}>{resetMessage}</Text>
            ) : null}

            <View style={styles.forgotActions}>
              <TouchableOpacity
                style={styles.forgotCancel}
                onPress={closeForgotPassword}
                disabled={resetLoading}
              >
                <Text style={styles.forgotCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  buttonStyles.primaryButton,
                  styles.forgotSubmit,
                  resetLoading && styles.disabledButton,
                ]}
                onPress={
                  resetStep === "request"
                    ? handleResetRequest
                    : handleResetPassword
                }
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={buttonStyles.primaryButtonText}>
                    {resetStep === "request" ? "Send code" : "Update password"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

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
  info: {
    color: BRAND_COLORS.muted,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  boldText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  modeSwitch: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  modeText: {
    color: BRAND_COLORS.muted,
    fontWeight: "600",
  },
  modeActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  modeTextActive: {
    color: BRAND_COLORS.text,
  },
  forgotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  forgotCard: {
    width: "100%",
    backgroundColor: BRAND_COLORS.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  forgotTitle: {
    color: BRAND_COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  forgotSubtitle: {
    color: BRAND_COLORS.muted,
    marginTop: 6,
    marginBottom: 16,
  },
  forgotActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  forgotCancel: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    paddingVertical: 12,
  },
  forgotCancelText: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  forgotSubmit: {
    flex: 1,
  },
});

export default AuthScreen;
