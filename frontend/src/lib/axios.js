import axios from "axios";

// Production: the backend serves this app, so the API lives on the same origin.
const PRODUCTION_BASE_URL = "/api";
const ENV_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
  ENV_BASE_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : PRODUCTION_BASE_URL);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies with the request
});

axiosInstance.defaults.headers.common["X-Client-Platform"] = "web";
