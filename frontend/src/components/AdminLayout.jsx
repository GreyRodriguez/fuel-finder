import { useRef } from "react";
import AdminNav from "./AdminNav";

/**
 * Shared page shell for all admin pages:
 * responsive AdminNav (sidebar on desktop, top bar + bottom quick tabs on mobile),
 * consistent header with optional right-side action, and padded scroll container.
 */
export default function AdminLayout({ title, subtitle, actions = null, children }) {
  const mainRef = useRef(null);

  return (
    <div className="h-dvh overflow-hidden bg-dark-900 flex flex-col md:flex-row">
      <AdminNav />
      <main
        ref={mainRef}
        id="main-content"
        className="flex-1 min-h-0 overflow-y-auto min-w-0 overscroll-contain px-4 pt-4 pb-24 md:p-8 md:pb-8"
      >
        <div className="max-w-7xl mx-auto">
          {(title || actions) && (
            <header className="flex flex-wrap items-start justify-between gap-3 mb-5 md:mb-7">
              <div className="min-w-0 flex-1">
                {title && <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h1>}
                {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

/** Floating toast anchored above the mobile bottom tab bar. */
export function AdminToast({ message, tone = "success" }) {
  return (
    <div
      aria-live="polite"
      className="fixed z-50 left-4 right-4 bottom-20 md:bottom-6 md:left-auto md:right-6 md:max-w-sm pointer-events-none"
    >
      {message && (
        <div
          className={`rounded-xl border shadow-2xl px-4 py-3 text-sm backdrop-blur-md ${
            tone === "error"
              ? "bg-danger/20 border-danger/40 text-red-200"
              : "bg-dark-600/95 border-white/15 text-white"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
