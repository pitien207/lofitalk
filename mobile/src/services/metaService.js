import api from "./api";

export const fetchMobileAppVersion = async () => {
  const response = await api.get("/meta/version");
  return response?.data?.mobileAppVersion || null;
};

export default {
  fetchMobileAppVersion,
};
