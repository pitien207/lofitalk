import { useState } from "react";
import { Alert } from "react-native";
import { loginRequest } from "../services/authService";
import { setAuthToken } from "../services/api";

const useAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const clearError = () => {
    if (error) {
      setError(null);
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    clearError();
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    clearError();
  };

  const login = async () => {
    if (!email || !password) {
      setError("Please fill in email and password");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loginRequest(email, password);
      setUser(data.user || { fullName: "Friend" });
      if (data.token) {
        setToken(data.token);
      }
      setPassword("");

      Alert.alert(
        "Login successful",
        `Welcome back ${data.user?.fullName || "friend"}!`
      );

      return data;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Login failed, please try again.";
      setError(message);
      Alert.alert("Login failed", message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    setEmail("");
    setPassword("");
    setError(null);
    setAuthToken(null);
  };

  const updateUserProfile = (nextUser) => {
    if (nextUser) {
      setUser(nextUser);
    }
  };

  return {
    email,
    password,
    loading,
    error,
    user,
    token,
    login,
    signOut,
    handleEmailChange,
    handlePasswordChange,
    updateUserProfile,
  };
};

export default useAuth;
