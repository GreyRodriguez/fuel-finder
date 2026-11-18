import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, UserPlus, MessageSquare, AlertTriangle, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import useApiData from "../../../hooks/useApiData";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../../components/DataStates";
import { formatDate, peso } from "../../../utils/format";
import { CATEGORY_STYLE, STATUS_STYLE, STATUS_LABEL } from "./feedbackStyles";

const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

function Card({ title, hint, action, children, className = "" }) {
  return (
    <div className={`glass-card p-4 md:p-6 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-white font-bold text-base md:text-lg">{title}</h2>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "text-white" }) {
  return (
    <div className="glass-card p-4 md:p-5 min-w-0">
      <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <p className={`text-2xl md:text-3xl font-black ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 leading-snug">{sub}</p>}
    </div>
  );
}

/** Horizontal labelled bar, value relative to `max`. */
function Bar({ label, value, max, color = "bg-primary" }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <li>
      <div className="flex items-center justify-between gap-3 text-sm mb-1">
        <span className="text-slate-300 truncate">{label}</span>
        <span className="text-white font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-dark-600 overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

/** Vertical bar chart of price updates per day (or per week for long periods). */
function ActivityChart({ data }) {
  const max = Math.max(0, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!data.length) return null;
  const first = data[0];
  const last = data[data.length - 1];
  const bucketLabel = (d) => (d.end ? `${formatDate(d.label)} – ${formatDate(d.end)}` : formatDate(d.label));

  return (
    <figure>
      <div
        role="img"
        aria-label={`${total} price updates from ${formatDate(first.label)} to ${formatDate(last.end || last.label)}. Busiest: ${max} in one ${first.end ? "week" : "day"}.`}
        className="h-36 md:h-44 flex items-end gap-[2px] sm:gap-1"
      >
        {data.map((d) => (
          <div key={d.label} className="flex-1 h-full flex items-end min-w-0" title={`${bucketLabel(d)}: ${d.count} update${d.count === 1 ? "" : "s"}`}>
            <div
              className={`w-full rounded-t ${d.count ? "bg-primary/80 hover:bg-primary" : "bg-dark-600"} transition-colors`}
              style={{ height: d.count ? `${Math.max(6, (d.count / max) * 100)}%` : "3px" }}
            />
          </div>
        ))}
      </div>
      <figcaption className="flex justify-between text-[11px] text-slate-500 mt-2">
        <span>{formatDate(first.label, { month: "short", day: "numeric" })}</span>
        <span>{first.end ? "per week" : "per day"}</span>
        <span>{formatDate(last.end || last.label, { month: "short", day: "numeric" })}</span>
      </figcaption>
    </figure>
  );
}

export default function ReportsOverview({ onOpenFeedback }) {
  const [days, setDays] = useState(30);
  const { data: r, loading, error, reload } = useApiData("/api/admin/reports", { days });

  const periodPicker = (
    <div role="group" aria-label="Reporting period" className="grid grid-cols-3 sm:inline-grid gap-1 p-1 rounded-xl bg-dark-800 border border-white/10">
      {PERIODS.map((p) => (
        <button
          key={p.days}
          type="button"
          aria-pressed={days === p.days}
          onClick={() => setDays(p.days)}
          className={`min-h-[40px] px-3 sm:px-4 rounded-lg text-sm font-medium transition-colors ${
            days === p.days ? "bg-dark-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  if (error) return <ErrorBlock message={error} onRetry={reload} />;

  if (loading && !r) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <LoadingBlock count={4} className="h-28" label="Loading reports…" />
      </div>
    );
  }

  const fb = r.feedback;
  const catMax = Math.max(0, ...fb.by_category.map((c) => c.count));
  const brandMax = Math.max(0, ...r.brands.map((b) => b.count));
  const missing = r.stations_without_prices;

  return (
    <div className={`space-y-4 md:space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-400">
          Showing <span className="text-white font-medium">{formatDate(r.period_start)}</span> – today
        </p>
        {periodPicker}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Kpi icon={Activity} label="Price updates" value={r.price_updates_in_period} sub={`in the last ${r.period_days} days`} tone="text-primary" />
        <Kpi icon={UserPlus} label="New users" value={r.new_users} sub={`${r.total_users} users in total`} tone="text-accent" />
        <Kpi icon={MessageSquare} label="Feedback received" value={fb.in_period}
          sub={fb.by_status.new ? `${fb.by_status.new} waiting for review` : "All caught up"}
          tone={fb.by_status.new ? "text-warning" : "text-success"} />
        <Kpi icon={AlertTriangle} label="Stations without prices" value={missing.length}
          sub={`of ${r.active_stations} active stations`} tone={missing.length ? "text-danger" : "text-success"} />
      </div>

      {/* Fuel prices + feedback breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card title="Current pump prices" hint="Active prices at active stations" className="lg:col-span-2">
          {r.fuel_summary.length === 0 ? (
            <EmptyBlock message="No active prices yet." />
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {r.fuel_summary.map((f) => (
                <li key={f.fuel_type} className="rounded-xl bg-dark-800 border border-white/5 p-4 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-white font-semibold truncate">{f.fuel_type}</p>
                    <p className="text-xs text-slate-500 flex-shrink-0">{f.stations} station{f.stations === 1 ? "" : "s"}</p>
                  </div>
                  <p className="text-2xl font-black text-white mt-1">{peso(f.avg)}<span className="text-xs font-normal text-slate-500"> avg / L</span></p>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <TrendingDown className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <dt className="sr-only">Cheapest</dt>
                      <dd className="min-w-0 flex-1">
                        <span className="text-success font-semibold">{peso(f.min)}</span>{" "}
                        <span className="text-slate-400 break-words">{f.cheapest?.name}</span>
                      </dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <dt className="sr-only">Most expensive</dt>
                      <dd className="min-w-0 flex-1">
                        <span className="text-danger font-semibold">{peso(f.max)}</span>{" "}
                        <span className="text-slate-400 break-words">{f.priciest?.name}</span>
                      </dd>
                    </div>
                  </dl>
                  <p className="text-[11px] text-slate-500 mt-2">Spread {peso(f.max - f.min)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="User feedback"
          hint={`${fb.total} total`}
          action={
            <button type="button" onClick={() => onOpenFeedback()} className="text-sm text-primary hover:text-primary-light inline-flex items-center gap-1 min-h-[44px] -my-3 flex-shrink-0">
              Open <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          }
        >
          <div className="grid grid-cols-3 gap-2 mb-5">
            {Object.entries(fb.by_status).map(([status, count]) => (
              <button
                key={status}
                type="button"
                onClick={() => onOpenFeedback(status)}
                className={`rounded-xl border px-2 py-3 text-center transition-colors hover:bg-white/5 ${STATUS_STYLE[status]}`}
                aria-label={`${count} ${STATUS_LABEL[status]} feedback — view`}
              >
                <p className="text-xl font-black">{count}</p>
                <p className="text-[11px] font-medium">{STATUS_LABEL[status]}</p>
              </button>
            ))}
          </div>
          {fb.by_category.length === 0 ? (
            <p className="text-sm text-slate-500">No feedback yet. It will show up here as soon as users send some.</p>
          ) : (
            <ul className="space-y-3" aria-label="Feedback by category">
              {fb.by_category.map((c) => (
                <Bar key={c.category} label={c.category} value={c.count} max={catMax} color={CATEGORY_STYLE[c.category]?.bar || "bg-slate-400"} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Activity + brands */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card title="Price update activity" hint={`${r.price_updates_in_period} updates in the last ${r.period_days} days`} className="lg:col-span-2">
          <ActivityChart data={r.price_activity} />
        </Card>
        <Card title="Stations by brand" hint={`${r.total_stations} stations · ${r.inactive_stations} inactive`}>
          {r.brands.length === 0 ? (
            <p className="text-sm text-slate-500">No stations yet.</p>
          ) : (
            <ul className="space-y-3 max-h-72 overflow-y-auto pr-1 overscroll-contain">
              {r.brands.map((b) => <Bar key={b.brand} label={b.brand} value={b.count} max={brandMax} color="bg-accent" />)}
            </ul>
          )}
        </Card>
      </div>

      {/* Coverage gaps + log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card
          title="Missing prices"
          hint="Active stations with no current price"
          action={missing.length > 0 && (
            <Link to="/admin/prices" className="text-sm text-primary hover:text-primary-light inline-flex items-center gap-1 min-h-[44px] -my-3 flex-shrink-0">
              Add <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        >
          {missing.length === 0 ? (
            <p className="text-sm text-success">Every active station has at least one price. 🎉</p>
          ) : (
            <ul className="divide-y divide-white/5 max-h-72 overflow-y-auto pr-1 overscroll-contain">
              {missing.map((s) => (
                <li key={s.station_id} className="py-2.5 min-w-0">
                  <p className="text-sm text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 truncate">{[s.brand, s.barangay].filter(Boolean).join(" · ") || "—"}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Price update log" hint="Last 10 updates" className="lg:col-span-2">
          {r.recent_price_updates.length === 0 ? (
            <p className="text-sm text-slate-500">No updates yet.</p>
          ) : (
            <>
              {/* Phones / tablets: stacked rows */}
              <ul className="lg:hidden divide-y divide-white/5">
                {r.recent_price_updates.map((p) => (
                  <li key={p.price_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.station_name}</p>
                      <p className="text-xs text-slate-400">{p.fuel_type}</p>
                      <p className="text-xs text-slate-500">{formatDate(p.date_updated)} · {p.time_updated?.slice(0, 5)}</p>
                    </div>
                    <p className="text-primary font-bold flex-shrink-0">{peso(p.price_per_liter)}</p>
                  </li>
                ))}
              </ul>
              {/* Desktop: table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      {["Station", "Fuel Type", "Price", "Date", "Time"].map((h) => (
                        <th key={h} scope="col" className="pb-3 text-slate-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.recent_price_updates.map((p) => (
                      <tr key={p.price_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-3 text-white">{p.station_name}</td>
                        <td className="py-3 pr-3 text-slate-300">{p.fuel_type}</td>
                        <td className="py-3 pr-3 text-primary font-bold">{peso(p.price_per_liter)}</td>
                        <td className="py-3 pr-3 text-slate-500">{formatDate(p.date_updated)}</td>
                        <td className="py-3 text-slate-500">{p.time_updated?.slice(0, 5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
