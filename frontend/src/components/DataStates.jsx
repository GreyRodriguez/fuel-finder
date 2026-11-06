import { Loader2, AlertTriangle, Inbox } from "lucide-react";

export function Spinner({ className = "w-4 h-4" }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden="true" />;
}

/** Pulsing placeholder cards while a section loads. */
export function LoadingBlock({ count = 3, className = "h-36", label = "Loading…" }) {
  return (
    <div role="status" aria-live="polite" className="contents">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`glass-card animate-pulse ${className}`} aria-hidden="true" />
      ))}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div role="alert" className="glass-card col-span-full p-5 flex flex-col sm:flex-row sm:items-center gap-3 border-danger/30">
      <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" aria-hidden="true" />
      <p className="text-sm text-slate-300 flex-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary text-sm min-h-[44px] px-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({ message }) {
  return (
    <div className="glass-card col-span-full p-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
      <Inbox className="w-6 h-6 text-slate-500" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

