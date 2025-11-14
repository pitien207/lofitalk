import axios from "axios";

const PRODUCTION_BASE_URL = "https://lofitalk.onrender.com/api";
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://192.168.0.100:5001/api"
    : PRODUCTION_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.defaults.headers.common["X-Client-Platform"] = "mobile";

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
