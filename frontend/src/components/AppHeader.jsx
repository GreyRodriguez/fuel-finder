import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery";
import { MAIN_NAV } from "../config/mainNav";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Shared top header for the signed-in user area.
 *  - Desktop (≥768px): logo + horizontal menu (orange underline on the active item), profile + Logout on the right.
 *  - Mobile (<768px): hamburger → slide-in drawer (≥44px tap targets). Closes on route change, outside tap and Esc.
 * `actions` renders extra page-specific controls just before the profile/logout buttons (e.g. Dashboard's Compare).
 */
export default function AppHeader({ actions = null }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [open, setOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const drawerRef = useRef(null);
  const menuRef = useRef(null);

  const firstName = user?.full_name?.split(" ")[0];
  const pathname = location.pathname;

  // Close the drawer on route change, and when the viewport grows to desktop
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { if (!isMobile) setOpen(false); }, [isMobile]);

  // While open: Esc closes, Tab is trapped inside the drawer, focus returns to the hamburger afterwards
  useEffect(() => {
    if (!open) return;
    const menuBtn = menuBtnRef.current;
    closeBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { setOpen(false); return; }
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
      document.removeEventListener("keydown", onKey);
      menuBtn?.focus({ preventScroll: true });
    };
  }, [open]);

  // Arrow-key navigation across the desktop menu links
  const onMenuKeyDown = (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" };
    if (!(e.key in keys)) return;
    const links = [...menuRef.current.querySelectorAll("a")];
    const i = links.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const step = keys[e.key];
    const next = step === "first" ? 0 : step === "last" ? links.length - 1 : (i + step + links.length) % links.length;
    links[next].focus();
  };

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <header className="flex-shrink-0 bg-dark-800 border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-6 min-w-0">
        {/* Mobile hamburger */}
        <button
          ref={menuBtnRef}
          id="main-menu-btn"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open main menu"
          aria-expanded={open}
          aria-controls="main-drawer"
          className={`md:hidden -ml-2 flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-dark-700 transition-colors ${focusRing}`}
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>

        <Link to="/" className={`text-lg md:text-xl font-black text-white flex-shrink-0 rounded ${focusRing}`}>
          Fuel<span className="text-primary">Finder</span>
        </Link>

        {/* Desktop menu */}
        <nav aria-label="Main navigation" className="hidden md:block min-w-0">
          <ul ref={menuRef} onKeyDown={onMenuKeyDown} className="flex items-center gap-0.5 lg:gap-1">
            {MAIN_NAV.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                    className={`flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 text-[13px] lg:text-sm font-medium whitespace-nowrap border-b-2 transition-colors rounded-t-md ${focusRing} ${
                      active
                        ? "text-white border-primary"
                        : "text-slate-400 border-transparent hover:text-white hover:border-white/20"
                    }`}
                  >
                    {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} aria-hidden="true" />}
                    {item.shortLabel ? (
                      <>
                        <span className="lg:hidden" aria-hidden="true">{item.shortLabel}</span>
                        <span className="hidden lg:inline" aria-hidden="true">{item.label}</span>
                      </>
                    ) : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {actions}
        {/* Mobile: avatar initial. Desktop: name button (wrapped — .btn-secondary forces display). */}
        <Link
          to="/dashboard/profile"
          id="profile-avatar"
          aria-label="My profile"
          className={`md:hidden w-9 h-9 flex-shrink-0 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-sm font-bold text-white ${focusRing}`}
        >
          {firstName?.[0]?.toUpperCase() || "U"}
        </Link>
        <div className="hidden md:block min-w-0">
          <Link to="/dashboard/profile" className={`btn-secondary text-sm px-3 lg:px-4 py-2 max-w-[9rem] truncate ${focusRing}`}>
            {firstName}
          </Link>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          aria-label="Logout"
          className={`flex-shrink-0 flex items-center justify-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors w-11 h-11 -mr-2 md:w-9 md:h-9 md:mr-0 lg:w-auto lg:h-auto lg:px-2 lg:py-1 rounded-lg ${focusRing}`}
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>

      {/* Mobile drawer: backdrop (outside tap closes) + panel */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        ref={drawerRef}
        id="main-drawer"
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Main navigation"
        inert={!open}
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] bg-dark-800 border-r border-white/10 shadow-2xl
                    flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none ${
                      open ? "translate-x-0" : "-translate-x-full"
                    }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-lg font-black text-white">
            Fuel<span className="text-primary">Finder</span>
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close main menu"
            className={`-mr-2 w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors ${focusRing}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto overscroll-contain p-3">
          <ul className="space-y-1">
            {MAIN_NAV.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 min-h-[48px] px-4 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${focusRing} ${
                      active
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-slate-300 border border-transparent hover:bg-dark-700 hover:text-white"
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />}
                    <span className="min-w-0">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </header>
  );
}
