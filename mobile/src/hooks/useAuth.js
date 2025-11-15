import { useEffect, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginRequest } from "../services/authService";
import { setAuthToken } from "../services/api";

const AUTH_STORAGE_KEY = "lofitalk_auth_session";

const useAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

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

  const persistSession = async (nextUser, nextToken) => {
    try {
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: nextUser ?? user,
          token: nextToken ?? token,
        })
      );
    } catch (storageError) {
      console.log("Failed to persist session", storageError);
    }
  };

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token) {
            setToken(parsed.token);
            setAuthToken(parsed.token);
          }
          if (parsed.user) {
            setUser(parsed.user);
          }
        }
      } catch (storageError) {
        console.log("Failed to hydrate session", storageError);
      } finally {
        setIsHydrating(false);
      }
    };

    hydrateSession();
  }, []);

  const login = async () => {
    if (!email || !password) {
      setError("Please fill in email and password");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loginRequest(email, password);
      const resolvedUser = data.user || { fullName: "Friend" };
      setUser(resolvedUser);
      if (data.token) {
        setToken(data.token);
        setAuthToken(data.token);
      }
      setPassword("");

      await persistSession(resolvedUser, data.token);

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
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => null);
  };

  const updateUserProfile = (nextUser) => {
    if (nextUser) {
      setUser(nextUser);
      persistSession(nextUser, token);
    }
  };

  return {
    email,
    password,
    loading,
    error,
    user,
    token,
    isHydrating,
    login,
    signOut,
    handleEmailChange,
    handlePasswordChange,
    updateUserProfile,
  };
};

export default useAuth;
