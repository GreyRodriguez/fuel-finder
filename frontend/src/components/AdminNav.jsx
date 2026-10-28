import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery";

const navLinks = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/stations", label: "Stations", icon: "⛽" },
  { to: "/admin/prices", label: "Fuel Prices", icon: "💰" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/reports", label: "Reports", icon: "📈" },
  { to: "/admin/profile", label: "Profile", icon: "👤" },
];

/**
 * Admin navigation.
 * - Desktop (≥768px): sticky left sidebar (unchanged).
 * - Mobile (<768px): top bar with a ☰ button that slides the same sidebar in as a drawer.
 *   Dismiss by tapping the backdrop, pressing Escape, or choosing a link.
 */
export default function AdminNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [open, setOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const drawerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close the drawer whenever the route changes
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // While open on mobile: Escape closes, page content is inert, focus moves into the drawer
  useEffect(() => {
    if (!isMobile || !open) return;
    const main = document.querySelector("main");
    const menuBtn = menuBtnRef.current;
    if (main) main.inert = true;
    drawerRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      if (main) main.inert = false;
      document.removeEventListener("keydown", onKey);
      menuBtn?.focus({ preventScroll: true });
    };
  }, [isMobile, open]);

  const hiddenOnMobile = isMobile && !open;

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-dark-800 border-b border-white/10 z-30">
        <button
          ref={menuBtnRef}
          id="admin-menu-btn"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="-ml-2 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-dark-700 transition-colors"
        >
          <svg className="w-6 h-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/admin" className="text-lg font-black text-white flex items-center">
          Fuel<span className="text-primary">Finder</span>
          <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Admin
          </span>
        </Link>
      </header>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        ref={drawerRef}
        id="admin-drawer"
        tabIndex={-1}
        inert={hiddenOnMobile}
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,82vw)] shadow-2xl transition-transform duration-300 ease-out outline-none
                    ${open ? "translate-x-0" : "-translate-x-full"}
                    md:static md:z-30 md:w-64 md:translate-x-0 md:shadow-none md:transition-none
                    flex-shrink-0 bg-dark-800 border-r border-white/10 h-dvh flex flex-col overflow-y-auto overscroll-contain`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
          <Link to="/admin" className="text-xl font-black text-white flex items-center">
            Fuel<span className="text-primary">Finder</span>
            <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="md:hidden -mr-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpen(false)}
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
    </>
  );
}
