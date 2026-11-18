import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Mail, Trash2, CheckCircle2, Eye, RotateCcw, Fuel, UserRound, X } from "lucide-react";
import api from "../../../services/api";
import useApiData from "../../../hooks/useApiData";
import { notifyFeedbackChanged } from "../../../hooks/useFeedbackSummary";
import { LoadingBlock, ErrorBlock, EmptyBlock, Spinner } from "../../../components/DataStates";
import { peso } from "../../../utils/format";
import { CATEGORY_STYLE, STATUS_STYLE, STATUS_LABEL, FEEDBACK_CATEGORIES } from "./feedbackStyles";

const STATUS_FILTERS = ["", "new", "reviewed", "resolved"];

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso);
  const s = Math.round((Date.now() - then.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return then.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

const fullDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";

/** Status transitions offered for each current status. */
const NEXT_ACTIONS = {
  new: [
    { to: "reviewed", label: "Mark reviewed", icon: Eye },
    { to: "resolved", label: "Resolve", icon: CheckCircle2 },
  ],
  reviewed: [
    { to: "resolved", label: "Resolve", icon: CheckCircle2 },
    { to: "new", label: "Mark as new", icon: RotateCcw },
  ],
  resolved: [{ to: "new", label: "Reopen", icon: RotateCcw }],
};

function PriceReport({ f }) {
  const diff = f.reported_price != null && f.current_price != null ? f.reported_price - f.current_price : null;
  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
      <p className="flex items-center gap-2 text-white font-medium min-w-0">
        <Fuel className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
        <span className="truncate">{f.station_name || "Station removed"}</span>
      </p>
      <dl className="grid grid-cols-3 gap-2 mt-2 text-xs">
        <div className="min-w-0">
          <dt className="text-slate-500">Fuel</dt>
          <dd className="text-slate-200 font-medium truncate">{f.fuel_type || "—"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Reported</dt>
          <dd className="text-primary font-bold tabular-nums">{peso(f.reported_price)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Listed now</dt>
          <dd className="text-slate-200 font-medium tabular-nums">
            {peso(f.current_price)}
            {diff != null && Math.abs(diff) >= 0.01 && (
              <span className={`block text-[11px] ${diff < 0 ? "text-success" : "text-danger"}`}>
                {diff > 0 ? "+" : "−"}{peso(Math.abs(diff)).slice(1)} vs listed
              </span>
            )}
            {diff != null && Math.abs(diff) < 0.01 && <span className="block text-[11px] text-slate-500">matches</span>}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function FeedbackCard({ f, busy, onStatus, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const long = f.message.length > 220;
  const sender = f.name || f.user_full_name || "Anonymous";
  const cat = CATEGORY_STYLE[f.category] || CATEGORY_STYLE.Other;
  const mailto = f.email
    ? `mailto:${f.email}?subject=${encodeURIComponent(`Re: your FuelFinder feedback (${f.category})`)}`
    : null;

  return (
    <li className={`glass-card p-4 md:p-5 min-w-0 flex flex-col ${f.status === "new" ? "border-l-4 border-l-warning" : ""}`}>
      {/* Badges + time */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${cat.badge}`}>{f.category}</span>
        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_STYLE[f.status]}`}>{STATUS_LABEL[f.status]}</span>
        <time dateTime={f.created_at} title={fullDate(f.created_at)} className="ml-auto text-xs text-slate-500">
          {timeAgo(f.created_at)}
        </time>
      </div>

      {/* Sender */}
      <div className="mt-3 flex items-center gap-2 min-w-0 text-sm">
        <UserRound className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
        <span className="text-white font-medium truncate">{sender}</span>
        {f.user_id && <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded">Member</span>}
      </div>
      {f.email && (
        <a href={`mailto:${f.email}`} className="text-xs text-slate-400 hover:text-white break-all mt-0.5 ml-6 w-fit">{f.email}</a>
      )}

      {/* Message */}
      <p className={`mt-3 text-sm text-slate-300 whitespace-pre-wrap break-words ${long && !expanded ? "line-clamp-4" : ""}`}>
        {f.message}
      </p>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}
          className="self-start text-xs text-primary hover:text-primary-light mt-1 py-1">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {f.category === "Price Report" && <PriceReport f={f} />}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
        {NEXT_ACTIONS[f.status]?.map((a) => (
          <button
            key={a.to}
            type="button"
            disabled={busy}
            onClick={() => onStatus(f, a.to)}
            className="btn-secondary text-xs h-9 px-3 gap-1.5 disabled:opacity-50"
          >
            <a.icon className="w-3.5 h-3.5" aria-hidden="true" /> {a.label}
          </button>
        ))}
        {f.category === "Price Report" && f.station_id && (
          <Link
            to={`/admin/prices?station_id=${f.station_id}${f.fuel_type ? `&fuel_type=${encodeURIComponent(f.fuel_type)}` : ""}${f.reported_price != null ? `&price=${f.reported_price}` : ""}`}
            className="btn-secondary text-xs h-9 px-3 gap-1.5"
          >
            <Fuel className="w-3.5 h-3.5" aria-hidden="true" /> Update price
          </Link>
        )}
        {mailto && (
          <a href={mailto} className="btn-secondary text-xs h-9 px-3 gap-1.5">
            <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Reply
          </a>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(f)}
          aria-label={`Delete feedback from ${sender}`}
          className="btn-danger text-xs h-9 px-3 inline-flex items-center justify-center gap-1.5 ml-auto disabled:opacity-50"
        >
          {busy ? <Spinner className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </li>
  );
}

export default function FeedbackInbox({ summary }) {
  const [params, setParams] = useSearchParams();
  const status = STATUS_FILTERS.includes(params.get("status") || "") ? params.get("status") || "" : "";
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = { limit: 200, ...(status && { status }), ...(category && { category }), ...(q && { q }) };
  const { data, loading, error, reload, mutate } = useApiData("/api/admin/feedback", query);
  const items = data ?? [];
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const flash = (msg) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3500);
  };

  const setStatusFilter = (s) => {
    const next = new URLSearchParams(params);
    next.set("tab", "feedback");
    if (s) next.set("status", s); else next.delete("status");
    setParams(next, { replace: true });
  };

  const changeStatus = async (f, to) => {
    setBusyId(f.feedback_id);
    try {
      const { data: updated } = await api.patch(`/api/admin/feedback/${f.feedback_id}`, { status: to });
      // Drop it from the list if it no longer matches the active status filter
      mutate((list) => {
        const rows = list ?? [];
        return status && to !== status
          ? rows.filter((x) => x.feedback_id !== f.feedback_id)
          : rows.map((x) => (x.feedback_id === f.feedback_id ? updated : x));
      });
      flash(`Marked as ${STATUS_LABEL[to].toLowerCase()}.`);
      notifyFeedbackChanged();
    } catch (err) {
      flash(err.response?.data?.detail || "Couldn't update. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (f) => {
    if (!confirm("Delete this feedback permanently?")) return;
    setBusyId(f.feedback_id);
    try {
      await api.delete(`/api/admin/feedback/${f.feedback_id}`);
      mutate((list) => (list ?? []).filter((x) => x.feedback_id !== f.feedback_id));
      flash("Feedback deleted.");
      notifyFeedbackChanged();
    } catch (err) {
      flash(err.response?.data?.detail || "Couldn't delete. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = Boolean(status || category || q);
  const clearFilters = () => { setCategory(""); setSearch(""); setQ(""); setStatusFilter(""); };
  const countFor = (s) => (s ? summary?.[s] : summary?.total);

  return (
    <div className="space-y-4">
      {/* Status chips — scroll sideways on narrow phones */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
        <div role="group" aria-label="Filter by status" className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
          {STATUS_FILTERS.map((s) => {
            const active = status === s;
            const n = countFor(s);
            return (
              <button
                key={s || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(s)}
                className={`min-h-[40px] px-4 rounded-full border text-sm font-medium whitespace-nowrap inline-flex items-center gap-2 transition-colors ${
                  active ? "bg-white text-dark-900 border-white" : "bg-dark-800 text-slate-300 border-white/10 hover:text-white hover:border-white/25"
                }`}
              >
                {s ? STATUS_LABEL[s] : "All"}
                {n != null && <span className={`text-xs tabular-nums ${active ? "text-dark-600" : "text-slate-500"}`}>{n}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category + search */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] gap-3">
        <div>
          <label htmlFor="fb-filter-category" className="sr-only">Category</label>
          <select id="fb-filter-category" className="input-field min-h-[44px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {FEEDBACK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="relative">
          <label htmlFor="fb-filter-search" className="sr-only">Search feedback</label>
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="fb-filter-search"
            type="search"
            enterKeyHint="search"
            className="input-field min-h-[44px] pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
            placeholder="Search message, name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setQ(""); }}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 min-h-[28px]">
        <p className="text-xs text-slate-500" aria-live="polite">
          {loading ? "Loading…" : `${items.length} item${items.length === 1 ? "" : "s"}${filtered ? " match your filters" : ""}`}
        </p>
        {filtered && (
          <button type="button" onClick={clearFilters} className="text-xs text-primary hover:text-primary-light inline-flex items-center gap-1 py-1">
            <X className="w-3.5 h-3.5" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      {/* Toast */}
      <div aria-live="polite" className="fixed z-50 left-4 right-4 bottom-20 md:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm pointer-events-none">
        {notice && (
          <div className="rounded-xl bg-dark-600/95 backdrop-blur-md border border-white/15 shadow-2xl px-4 py-3 text-sm text-white">{notice}</div>
        )}
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
          <LoadingBlock count={4} className="h-48" label="Loading feedback…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyBlock message={filtered ? "No feedback matches these filters." : "No feedback yet. When users send feedback it will appear here."} />
      ) : (
        <ul className={`grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 items-start transition-opacity ${loading ? "opacity-60" : ""}`}>
          {items.map((f) => (
            <FeedbackCard key={f.feedback_id} f={f} busy={busyId === f.feedback_id} onStatus={changeStatus} onDelete={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}
