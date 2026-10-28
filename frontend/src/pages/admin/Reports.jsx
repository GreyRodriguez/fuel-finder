import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminNav from "../../components/AdminNav";

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/reports").then((r) => setReports(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-dvh overflow-hidden bg-dark-900 flex flex-col md:flex-row">
      <AdminNav />
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 min-w-0 overscroll-contain">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-black text-white">Reports</h1>
        </div>
        {loading ? <p className="text-slate-400">Loading…</p> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {[
                { label: "Total Stations", value: reports?.total_stations, color: "text-white" },
                { label: "Active Stations", value: reports?.active_stations, color: "text-green-400" },
                { label: "Inactive", value: reports?.inactive_stations, color: "text-red-400" },
                { label: "Total Users", value: reports?.total_users, color: "text-cyan-400" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-4 md:p-6">
                  <p className="text-slate-400 text-sm mb-2">{s.label}</p>
                  <p className={`text-3xl md:text-4xl font-black ${s.color}`}>{s.value ?? 0}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Price Update Log</h2>
                <span className="text-xs text-slate-500">Last 10 updates</span>
              </div>

              {/* Mobile / tablet: stacked rows */}
              <ul className="lg:hidden divide-y divide-white/5">
                {reports?.recent_price_updates?.map((p) => (
                  <li key={p.price_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.station_name}</p>
                      <p className="text-xs text-slate-400">{p.fuel_type}</p>
                      <p className="text-xs text-slate-500">{p.date_updated} {p.time_updated}</p>
                    </div>
                    <p className="text-primary font-bold flex-shrink-0">₱{p.price_per_liter.toFixed(2)}</p>
                  </li>
                ))}
                {reports?.recent_price_updates?.length === 0 && (
                  <li className="py-8 text-center text-slate-500 text-sm">No updates yet.</li>
                )}
              </ul>

              {/* Desktop: table */}
              <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-3 text-slate-400 font-medium">Station</th>
                    <th className="pb-3 text-slate-400 font-medium">Fuel Type</th>
                    <th className="pb-3 text-slate-400 font-medium">Price</th>
                    <th className="pb-3 text-slate-400 font-medium">Date</th>
                    <th className="pb-3 text-slate-400 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reports?.recent_price_updates?.map((p) => (
                    <tr key={p.price_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 text-white">{p.station_name}</td>
                      <td className="py-3 text-slate-300">{p.fuel_type}</td>
                      <td className="py-3 text-primary font-bold">₱{p.price_per_liter.toFixed(2)}</td>
                      <td className="py-3 text-slate-500">{p.date_updated}</td>
                      <td className="py-3 text-slate-500">{p.time_updated}</td>
                    </tr>
                  ))}
                  {reports?.recent_price_updates?.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No updates yet.</td></tr>
                  )}
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
