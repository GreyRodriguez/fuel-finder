import { Link } from "react-router-dom";
import {
  Fuel, Users, MessageSquare, AlertTriangle, ArrowRight,
  Banknote, Plus, Megaphone, CheckCircle2, Clock,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import useFeedbackSummary from "../../hooks/useFeedbackSummary";
import { formatDate, peso } from "../../utils/format";

const FUEL_BADGE = {
  "Unleaded 91": "bg-primary/10 text-primary border-primary/20",
  "Premium 95": "bg-purple-500/10 text-purple-300 border-purple-500/20",
  Diesel: "bg-accent/10 text-accent border-accent/20",
};

const QUICK_ACTIONS = [
  { to: "/admin/prices", label: "Update Price", desc: "Log new pump price", icon: Banknote, tone: "bg-primary/15 text-primary" },
  { to: "/admin/stations?new=1", label: "Add Station", desc: "Register Taguig site", icon: Plus, tone: "bg-success/15 text-success" },
  { to: "/admin/updates", label: "Post Update", desc: "Forecasts & advisories", icon: Megaphone, tone: "bg-accent/15 text-accent" },
  { to: "/admin/reports?tab=feedback", label: "User Feedback", desc: "Review submissions", icon: MessageSquare, tone: "bg-warning/15 text-warning" },
];

function StatCard({ icon: Icon, label, value, sub, tone = "text-white", iconTone = "bg-white/5 text-slate-300" }) {
  return (
    <div className="glass-card p-4 md:p-5 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-slate-400 text-xs md:text-sm font-medium truncate">{label}</p>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconTone}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      </div>
      <p className={`text-2xl md:text-3xl font-black tabular-nums ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: reports, loading, error, reload } = useApiData("/api/admin/reports", { days: 30 });
  const { summary } = useFeedbackSummary();
  const newFeedback = summary?.new ?? 0;

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Taguig station coverage, recent pump prices and user feedback."
      actions={
        <Link to="/admin/prices" className="btn-primary text-sm min-h-[44px] px-4 gap-2 w-full sm:w-auto">
          <Banknote className="w-4 h-4" aria-hidden="true" /> Update Price
        </Link>
      }
    >
      {newFeedback > 0 && (
        <Link
          to="/admin/reports?tab=feedback&status=new"
          className="mb-5 md:mb-6 flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3.5 text-sm text-warning hover:bg-warning/15 transition-colors"
        >
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning" />
          </span>
          <span className="flex-1 min-w-0">
            <strong>{newFeedback}</strong> new feedback {newFeedback === 1 ? "message" : "messages"} waiting for review.
          </span>
          <span className="inline-flex items-center gap-1 font-semibold flex-shrink-0">
            Review <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </Link>
      )}

      {/* Quick actions */}
      <section aria-label="Quick actions" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 md:mb-6">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="glass-card p-3.5 md:p-4 flex items-center gap-3 hover:border-white/20 hover:bg-dark-600/60 active:scale-[0.99] transition-all min-w-0"
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.tone}`}>
              <a.icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{a.label}</p>
              <p className="text-xs text-slate-400 truncate hidden sm:block">{a.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading && !reports ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <LoadingBlock count={4} className="h-28" label="Loading dashboard…" />
        </div>
      ) : (
        <div className="space-y-5 md:space-y-6">
          {/* Snapshot KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              icon={Fuel}
              label="Total Stations"
              value={reports?.total_stations ?? 0}
              sub={`${reports?.active_stations ?? 0} active · ${reports?.inactive_stations ?? 0} inactive`}
              iconTone="bg-primary/15 text-primary"
            />
            <StatCard
              icon={CheckCircle2}
              label="Active Stations"
              value={reports?.active_stations ?? 0}
              sub={reports?.total_stations ? `${Math.round((reports.active_stations / reports.total_stations) * 100)}% operational` : "No stations"}
              tone="text-success"
              iconTone="bg-success/15 text-success"
            />
            <StatCard
              icon={Users}
              label="Registered Users"
              value={reports?.total_users ?? 0}
              sub={`+${reports?.new_users ?? 0} in last 30 days`}
              tone="text-accent"
              iconTone="bg-accent/15 text-accent"
            />
            <StatCard
              icon={AlertTriangle}
              label="Missing Prices"
              value={reports?.stations_without_prices?.length ?? 0}
              sub={reports?.stations_without_prices?.length ? "Active stations need prices" : "All active stations priced"}
              tone={reports?.stations_without_prices?.length ? "text-warning" : "text-success"}
              iconTone={reports?.stations_without_prices?.length ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}
            />
          </div>

          {/* Pump price averages */}
          {reports?.fuel_summary?.length > 0 && (
            <section className="glass-card p-4 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-white font-bold text-base md:text-lg">Average Pump Prices</h2>
                  <p className="text-xs text-slate-500">Across active stations right now</p>
                </div>
                <Link to="/admin/reports" className="text-sm text-primary hover:text-primary-light inline-flex items-center gap-1 min-h-[44px] -my-2">
                  Reports <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {reports.fuel_summary.map((f) => (
                  <div key={f.fuel_type} className="rounded-xl bg-dark-800 border border-white/5 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${FUEL_BADGE[f.fuel_type] || "bg-white/5 text-slate-300 border-white/10"}`}>
                        {f.fuel_type}
                      </span>
                      <p className="text-xs text-slate-500 mt-1.5 truncate">
                        Low {peso(f.min)} · High {peso(f.max)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black text-white tabular-nums">{peso(f.avg)}</p>
                      <p className="text-[11px] text-slate-500">{f.stations} stations</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent price updates */}
          <section className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
                <h2 className="text-white font-bold text-base md:text-lg">Recent Price Updates</h2>
              </div>
              <Link to="/admin/reports" className="text-sm text-primary hover:text-primary-light inline-flex items-center gap-1 min-h-[44px] -my-2">
                Full log <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {reports?.recent_price_updates?.length === 0 ? (
              <EmptyBlock message="No price updates yet." />
            ) : (
              <>
                {/* Mobile / tablet: stacked cards */}
                <ul className="lg:hidden divide-y divide-white/5">
                  {reports?.recent_price_updates?.map((p) => (
                    <li key={p.price_id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{p.station_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${FUEL_BADGE[p.fuel_type] || "bg-white/5 text-slate-300 border-white/10"}`}>
                            {p.fuel_type}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(p.date_updated)} · {p.time_updated?.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                      <p className="text-primary font-black text-base tabular-nums flex-shrink-0">{peso(p.price_per_liter)}</p>
                    </li>
                  ))}
                </ul>

                {/* Desktop: table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-white/10">
                        {["Station", "Fuel Type", "Price", "Date", "Time"].map((h) => (
                          <th key={h} scope="col" className="pb-3 text-slate-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reports?.recent_price_updates?.map((p) => (
                        <tr key={p.price_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 pr-3 text-white font-medium">{p.station_name}</td>
                          <td className="py-3 pr-3">
                            <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${FUEL_BADGE[p.fuel_type] || "bg-white/5 text-slate-300 border-white/10"}`}>
                              {p.fuel_type}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-primary font-bold tabular-nums">{peso(p.price_per_liter)}</td>
                          <td className="py-3 pr-3 text-slate-400">{formatDate(p.date_updated)}</td>
                          <td className="py-3 text-slate-500">{p.time_updated?.slice(0, 5)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
