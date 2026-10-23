import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin" && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (role === "user" && user.role === "admin") return <Navigate to="/admin" replace />;

  return children;
}
