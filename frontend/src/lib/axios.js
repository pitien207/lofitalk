import axios from "axios";

const PRODUCTION_BASE_URL = "https://lofitalk.onrender.com/api";
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
