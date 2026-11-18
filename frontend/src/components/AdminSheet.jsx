import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Responsive dialog:
 * - Mobile (<640px): bottom sheet sliding from the bottom edge with safe-area padding.
 * - Tablet/Desktop (≥640px): centered modal dialog.
 */
export default function AdminSheet({ open, onClose, title, subtitle, maxWidth = "sm:max-w-xl", children }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    // Focus the sheet close button rather than an input so mobile virtual keyboards don't jump open immediately.
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
      />

      {/* Sheet / Modal panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full ${maxWidth} bg-dark-800 border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh]`}
      >
        {/* Drag handle indicator on mobile */}
        <div className="sm:hidden pt-2.5 flex justify-center flex-shrink-0" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Sticky header */}
        <div className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/10 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
