import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Fuel, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery";
import { MAIN_NAV } from "../config/mainNav";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";

/**
 * Shared top header for the signed-in user area.
 *  - Desktop (≥768px): logo + horizontal menu (clean active pill/underline), profile + Logout on the right.
 *  - Mobile (<768px): hamburger → slide-in drawer (≥44px tap targets). Closes on route change, outside tap and Esc.
 * `actions` renders extra page-specific controls just before the profile/logout buttons (e.g. Dashboard's Compare).
 */
export default function AppHeader({ actions = null }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [openPath, setOpenPath] = useState(null);
  const open = isMobile && openPath === pathname;
  const openDrawer = () => setOpenPath(pathname);
  const closeDrawer = () => setOpenPath(null);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const drawerRef = useRef(null);
  const menuRef = useRef(null);

  const firstName = user?.full_name?.split(" ")[0];

  // While open: Esc closes, Tab is trapped inside the drawer, focus returns to the hamburger afterwards
  useEffect(() => {
    if (!open) return;
    const menuBtn = menuBtnRef.current;
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
    <>
      <header className="flex-shrink-0 bg-[#090B10]/80 backdrop-blur-md border-b border-white/[0.06] px-4 md:px-6 h-15 md:h-16 flex items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
          {/* Mobile hamburger */}
          <button
            ref={menuBtnRef}
            id="main-menu-btn"
            type="button"
            onClick={openDrawer}
            aria-label="Open main menu"
            aria-expanded={open}
            aria-controls="main-drawer"
            className={`md:hidden -ml-2 flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.05] transition-colors ${focusRing}`}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <Link to="/" className={`inline-flex items-center gap-2 min-h-11 text-lg md:text-xl font-extrabold tracking-tight text-[#F8FAFC] flex-shrink-0 rounded-lg ${focusRing}`}>
            <span className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Fuel className="w-3.5 h-3.5 text-zinc-950" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span>
              Fuel<span className="text-orange-400">Finder</span>
            </span>
          </Link>

          {/* Desktop menu */}
          <nav aria-label="Main navigation" className="hidden md:block min-w-0">
            <ul ref={menuRef} onKeyDown={onMenuKeyDown} className="flex items-center gap-1">
              {MAIN_NAV.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={closeDrawer}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      className={`flex items-center gap-1.5 lg:gap-2 min-h-11 px-3 py-2 text-[13px] lg:text-sm font-medium whitespace-nowrap rounded-xl transition-all duration-200 ${focusRing} ${
                        active
                          ? "text-[#F8FAFC] bg-white/[0.07]"
                          : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${active ? "text-orange-400" : "text-slate-500"}`}
                          aria-hidden="true"
                        />
                      )}
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

        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {actions}
          {/* Mobile: 44px thumb-friendly avatar link */}
          <Link
            to="/dashboard/profile"
            id="profile-avatar"
            aria-label="My profile"
            className={`md:hidden w-11 h-11 flex-shrink-0 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-sm font-bold text-[#F8FAFC] hover:bg-white/[0.09] transition-colors ${focusRing}`}
          >
            {firstName?.[0]?.toUpperCase() || "U"}
          </Link>
          <div className="hidden md:block min-w-0">
            <Link
              to="/dashboard/profile"
              className={`inline-flex items-center gap-2 min-h-11 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-medium text-[#F8FAFC] max-w-[10rem] transition-all duration-200 ${focusRing}`}
            >
              <span className="w-6 h-6 rounded-full bg-orange-500/15 text-orange-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {firstName?.[0]?.toUpperCase() || "U"}
              </span>
              <span className="truncate">{firstName}</span>
            </Link>
          </div>
          <button
            id="logout-btn"
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.05] text-sm font-medium transition-colors w-11 h-11 -mr-1.5 md:mr-0 lg:w-auto lg:px-3 rounded-xl cursor-pointer ${focusRing}`}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile drawer rendered outside <header> so header backdrop-blur never traps fixed positioning */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`md:hidden fixed inset-0 z-[1100] bg-black/70 backdrop-blur-xs transition-opacity duration-300 ${
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
        className={`md:hidden fixed inset-y-0 left-0 z-[1200] h-dvh w-[min(19rem,86vw)] bg-[#0D1018] border-r border-white/[0.08] shadow-2xl
                    flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none ${
                      open ? "translate-x-0" : "-translate-x-full"
                    }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06]">
          <span className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#F8FAFC]">
            <span className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Fuel className="w-3.5 h-3.5 text-zinc-950" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span>
              Fuel<span className="text-orange-400">Finder</span>
            </span>
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close main menu"
            className={`-mr-2 w-11 h-11 flex items-center justify-center rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition-colors ${focusRing}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto overscroll-contain p-3">
          <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Navigation
          </p>
          <ul className="space-y-1">
            {MAIN_NAV.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={closeDrawer}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${focusRing} ${
                      active
                        ? "bg-[#161B29] text-[#F8FAFC] border border-white/[0.09]"
                        : "text-[#94A3B8] border border-transparent hover:bg-white/[0.04] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${active ? "text-orange-400" : "text-slate-500"}`}
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-white/[0.06] pb-safe space-y-1">
          <Link
            to="/dashboard/profile"
            onClick={closeDrawer}
            className={`flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04] transition-colors ${focusRing}`}
          >
            <UserRound className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{user?.full_name || "My Profile"}</span>
          </Link>
          <button
            type="button"
            onClick={() => { closeDrawer(); handleLogout(); }}
            className={`w-full flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer ${focusRing}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
