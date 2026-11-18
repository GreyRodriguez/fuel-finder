import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";
import api from "../../services/api";
import useFeedbackSummary from "../../hooks/useFeedbackSummary";

import AdminNav from "../../components/AdminNav";

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card p-4 md:p-6">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className={`text-3xl md:text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const { summary } = useFeedbackSummary();
  const newFeedback = summary?.new ?? 0;

  useEffect(() => {
    api.get("/api/admin/reports").then((r) => setReports(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-dvh overflow-hidden bg-dark-900 flex flex-col md:flex-row">
      {/* Sticky Sidebar Menu (drawer on mobile) */}
      <AdminNav />

      {/* Main Center Dashboard */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 min-w-0 overscroll-contain">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-black text-white">Dashboard Overview</h1>
        </div>

        {newFeedback > 0 && (
          <Link
            to="/admin/reports?tab=feedback&status=new"
            className="mb-6 md:mb-8 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning hover:bg-warning/15 transition-colors"
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1">
              You have <strong>{newFeedback}</strong> new feedback {newFeedback === 1 ? "message" : "messages"} from users.
            </span>
            <span className="inline-flex items-center gap-1 font-semibold flex-shrink-0">
              Review <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </span>
          </Link>
        )}

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <StatCard label="Total Stations" value={reports?.total_stations ?? 0} color="text-white" />
              <StatCard label="Active Stations" value={reports?.active_stations ?? 0} color="text-green-400" />
              <StatCard label="Inactive Stations" value={reports?.inactive_stations ?? 0} color="text-red-400" />
              <StatCard label="Total Users" value={reports?.total_users ?? 0} color="text-accent" />
            </div>

            {/* Recent price updates */}
            <div className="glass-card p-4 md:p-6">
              <h2 className="text-white font-bold text-lg mb-4">Recent Price Updates</h2>
              {reports?.recent_price_updates?.length === 0 && (
                <p className="text-slate-500 text-sm">No price updates yet.</p>
              )}

              {/* Mobile / tablet: stacked rows */}
              <ul className="lg:hidden divide-y divide-white/5">
                {reports?.recent_price_updates?.map((p) => (
                  <li key={p.price_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.station_name}</p>
                      <p className="text-xs text-slate-400">{p.fuel_type} · <span className="text-slate-500">{p.date_updated}</span></p>
                    </div>
                    <p className="text-primary font-bold flex-shrink-0">₱{p.price_per_liter.toFixed(2)}</p>
                  </li>
                ))}
              </ul>

              {/* Desktop: table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="pb-3 text-slate-400 font-medium">Station</th>
                      <th className="pb-3 text-slate-400 font-medium">Fuel Type</th>
                      <th className="pb-3 text-slate-400 font-medium">Price</th>
                      <th className="pb-3 text-slate-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports?.recent_price_updates?.map((p) => (
                      <tr key={p.price_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 text-white">{p.station_name}</td>
                        <td className="py-3 text-slate-300">{p.fuel_type}</td>
                        <td className="py-3 text-primary font-bold">₱{p.price_per_liter.toFixed(2)}</td>
                        <td className="py-3 text-slate-500">{p.date_updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
