import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Fuel, Banknote, Users, TrendingUp,
  UserRound, LogOut, Megaphone, Menu, X, MoreHorizontal,
} from "lucide-react";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery";
import useFeedbackSummary from "../hooks/useFeedbackSummary";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, exact: true },
  { to: "/admin/stations", label: "Stations", shortLabel: "Stations", icon: Fuel },
  { to: "/admin/prices", label: "Fuel Prices", shortLabel: "Prices", icon: Banknote },
  { to: "/admin/updates", label: "Updates & Forecasts", shortLabel: "Updates", icon: Megaphone },
  { to: "/admin/users", label: "Users", shortLabel: "Users", icon: Users },
  { to: "/admin/reports", label: "Reports", shortLabel: "Reports", icon: TrendingUp, badge: "feedback" },
  { to: "/admin/profile", label: "Profile", shortLabel: "Profile", icon: UserRound },
];

// Primary actions pinned to the mobile bottom bar; secondary pages live in the drawer ("More").
const BOTTOM_NAV = [
  NAV_LINKS[0], // Home
  NAV_LINKS[1], // Stations
  NAV_LINKS[2], // Prices
  NAV_LINKS[5], // Reports
];

const SECONDARY_PATHS = ["/admin/updates", "/admin/users", "/admin/profile"];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function isLinkActive(pathname, item) {
  return item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

/**
 * Admin navigation.
 * - Desktop (≥768px): persistent left sidebar.
 * - Mobile (<768px): compact frosted top bar + bottom tab bar for core tasks + slide-in drawer for all items.
 */
export default function AdminNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { summary } = useFeedbackSummary();
  const newFeedback = summary?.new ?? 0;

  // Derived open state: automatically closes when route changes or viewport grows to desktop.
  const [openPath, setOpenPath] = useState(null);
  const open = isMobile && openPath === location.pathname;
  const openDrawer = () => setOpenPath(location.pathname);
  const closeDrawer = () => setOpenPath(null);

  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const drawerRef = useRef(null);

  const initials = (user?.full_name || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const handleLogout = () => {
    closeDrawer();
    logout();
    navigate("/");
  };

  // While mobile drawer is open: inert main content, trap Tab/Escape, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const main = document.querySelector("main");
    const opener = menuBtnRef.current;
    if (main) main.inert = true;
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") { closeDrawer(); return; }
      if (e.key !== "Tab") return;
      const items = drawerRef.current?.querySelectorAll("a[href], button:not([disabled])");
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      if (main) main.inert = false;
      document.removeEventListener("keydown", onKey);
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  const hiddenOnMobile = isMobile && !open;
  const moreActive = SECONDARY_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 bg-dark-800/95 backdrop-blur-md border-b border-white/10 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            ref={menuBtnRef}
            id="admin-menu-btn"
            type="button"
            onClick={openDrawer}
            aria-label={newFeedback > 0 ? `Open menu (${newFeedback} new feedback)` : "Open menu"}
            aria-expanded={open}
            aria-controls="admin-drawer"
            className={`relative -ml-2 w-11 h-11 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-dark-700 transition-colors ${focusRing}`}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
            {newFeedback > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-dark-800" aria-hidden="true" />
            )}
          </button>
          <Link to="/admin" className={`text-lg font-black text-white flex items-center rounded ${focusRing}`}>
            Fuel<span className="text-primary">Finder</span>
            <span className="ml-2 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Admin
            </span>
          </Link>
        </div>

        <Link
          to="/admin/profile"
          aria-label="Admin profile"
          className={`w-9 h-9 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 border border-white/15 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${focusRing}`}
        >
          {initials}
        </Link>
      </header>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`md:hidden fixed inset-0 z-40 bg-black/65 backdrop-blur-xs transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Desktop sidebar / Mobile slide-in drawer */}
      <aside
        ref={drawerRef}
        id="admin-drawer"
        role={isMobile ? "dialog" : undefined}
        aria-modal={open ? "true" : undefined}
        tabIndex={-1}
        inert={hiddenOnMobile}
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 w-[min(18.5rem,84vw)] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none outline-none
                    ${open ? "translate-x-0" : "-translate-x-full"}
                    md:static md:z-30 md:w-64 md:translate-x-0 md:shadow-none md:transition-none
                    flex-shrink-0 bg-dark-800 border-r border-white/10 h-dvh flex flex-col overflow-y-auto overscroll-contain`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
          <Link to="/admin" className={`text-xl font-black text-white flex items-center rounded ${focusRing}`}>
            Fuel<span className="text-primary">Finder</span>
            <span className="ml-2 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Admin
            </span>
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close menu"
            className={`md:hidden -mr-2 w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-colors ${focusRing}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto overscroll-contain">
          {NAV_LINKS.map((item) => {
            const isActive = isLinkActive(location.pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                onClick={closeDrawer}
                className={`flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm ${focusRing} ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-400 hover:text-white hover:bg-dark-700/80"
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.9} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
                {item.badge === "feedback" && newFeedback > 0 && (
                  <span
                    className={`ml-auto min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${
                      isActive ? "bg-white text-primary" : "bg-primary text-white"
                    }`}
                  >
                    {newFeedback > 99 ? "99+" : newFeedback}
                    <span className="sr-only"> new feedback</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-white/10 flex-shrink-0 bg-dark-800/95 space-y-3">
          <Link
            to="/admin/profile"
            onClick={closeDrawer}
            className={`flex items-center gap-3 p-2 -mx-1 rounded-xl hover:bg-dark-700/70 transition-colors ${focusRing}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 border border-white/15 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || "Admin"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || "admin@example.com"}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`btn-danger w-full text-sm min-h-[44px] py-2 flex items-center justify-center gap-2 ${focusRing}`}
          >
            <LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar — one-thumb access to primary workflows */}
      <nav
        aria-label="Quick admin navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-dark-800/95 backdrop-blur-lg border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5">
          {BOTTOM_NAV.map((item) => {
            const active = isLinkActive(location.pathname, item);
            const Icon = item.icon;
            const badge = item.badge === "feedback" ? newFeedback : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 text-[11px] font-medium transition-colors ${focusRing} ${
                  active ? "text-primary" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`relative p-1 rounded-lg transition-colors ${active ? "bg-primary/15" : ""}`}>
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-dark-800">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-full">{item.shortLabel}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={openDrawer}
            aria-label="More admin options"
            aria-expanded={open}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 text-[11px] font-medium transition-colors ${focusRing} ${
              moreActive || open ? "text-primary" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className={`p-1 rounded-lg transition-colors ${moreActive || open ? "bg-primary/15" : ""}`}>
              <MoreHorizontal className="w-5 h-5" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
