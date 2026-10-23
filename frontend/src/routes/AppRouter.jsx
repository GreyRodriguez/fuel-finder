import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/user/Dashboard";
import StationDetails from "../pages/user/StationDetails";
import Compare from "../pages/user/Compare";
import Profile from "../pages/user/Profile";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Stations from "../pages/admin/Stations";
import Prices from "../pages/admin/Prices";
import Users from "../pages/admin/Users";
import Reports from "../pages/admin/Reports";
import AdminProfile from "../pages/admin/AdminProfile";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="user"><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/station/:id" element={<ProtectedRoute role="user"><StationDetails /></ProtectedRoute>} />
          <Route path="/dashboard/compare" element={<ProtectedRoute role="user"><Compare /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute role="user"><Profile /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/stations" element={<ProtectedRoute role="admin"><Stations /></ProtectedRoute>} />
          <Route path="/admin/prices" element={<ProtectedRoute role="admin"><Prices /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><Users /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
