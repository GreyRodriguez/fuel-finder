import { useEffect, useState } from "react";
import api from "../../services/api";

import AdminNav from "../../components/AdminNav";

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card p-6">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/reports").then((r) => setReports(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-dark-900 flex">
      {/* Sticky Sidebar Menu */}
      <AdminNav />

      {/* Main Center Dashboard */}
      <main className="flex-1 h-screen overflow-y-auto p-8 min-w-0 overscroll-contain">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 -mt-8 pt-8 pb-4 mb-6 bg-dark-900/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Stations" value={reports?.total_stations ?? 0} color="text-white" />
              <StatCard label="Active Stations" value={reports?.active_stations ?? 0} color="text-green-400" />
              <StatCard label="Inactive Stations" value={reports?.inactive_stations ?? 0} color="text-red-400" />
              <StatCard label="Total Users" value={reports?.total_users ?? 0} color="text-accent" />
            </div>

            {/* Recent price updates */}
            <div className="glass-card p-6">
              <h2 className="text-white font-bold text-lg mb-4">Recent Price Updates</h2>
              {reports?.recent_price_updates?.length === 0 && (
                <p className="text-slate-500 text-sm">No price updates yet.</p>
              )}
              <div className="overflow-x-auto">
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
