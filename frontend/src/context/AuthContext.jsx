import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("ff_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Listen for 401 auto-logout events from api.js interceptor
  // We clear user state here; navigation is handled by ProtectedRoute automatically
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem("ff_token");
      localStorage.removeItem("ff_user");
    };
    window.addEventListener("ff:logout", handleLogout);
    return () => window.removeEventListener("ff:logout", handleLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { access_token, role, full_name, user_id } = res.data;
    const userData = { access_token, role, full_name, user_id };
    localStorage.setItem("ff_token", access_token);
    localStorage.setItem("ff_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (full_name, email, password, confirm_password) => {
    const res = await api.post("/api/auth/register", { full_name, email, password, confirm_password });
    const { access_token, role, full_name: name, user_id } = res.data;
    const userData = { access_token, role, full_name: name, user_id };
    localStorage.setItem("ff_token", access_token);
    localStorage.setItem("ff_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
