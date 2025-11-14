import api from "./api";

export const fetchStreamToken = async () => {
  const { data } = await api.get("/chat/token");
  return data;
};
