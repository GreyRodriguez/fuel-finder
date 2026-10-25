import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/stations", label: "Stations", icon: "⛽" },
  { to: "/admin/prices", label: "Fuel Prices", icon: "💰" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/reports", label: "Reports", icon: "📈" },
  { to: "/admin/profile", label: "Profile", icon: "👤" },
];

export default function AdminNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-dark-800 border-r border-white/10 h-screen sticky top-0 flex flex-col overflow-y-auto overscroll-contain z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex-shrink-0">
        <Link to="/admin" className="text-xl font-black text-white flex items-center">
          Fuel<span className="text-primary">Finder</span>
          <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Admin
          </span>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-dark-700"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-white/10 flex-shrink-0 bg-dark-800">
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-white truncate">{user?.full_name || "Admin"}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email || "admin@example.com"}</p>
        </div>
        <button
          onClick={handleLogout}
          className="btn-danger w-full text-sm py-2 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
