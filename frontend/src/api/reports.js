import api from "./auth";

export const reportPost = async (postId, payload = {}) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.post(`/reports/posts/${postId}`, payload, { headers });
  return data;
};

