import axios from "axios";
import { API_BASE_URL } from "../config";

export { API_BASE_URL };

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
