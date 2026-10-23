import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request automatically (skip auth endpoints)
api.interceptors.request.use((config) => {
  const url = config.url || "";
  const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");
  if (!isAuthRoute) {
    const token = localStorage.getItem("ff_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 — dispatch event so React handles it (avoids hard-reload loop)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only auto-logout if it's NOT a login/register request itself
      const url = err.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        localStorage.removeItem("ff_token");
        localStorage.removeItem("ff_user");
        window.dispatchEvent(new Event("ff:logout"));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
