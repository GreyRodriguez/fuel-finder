import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function AdminNav() {
  return (
    <aside className="w-64 flex-shrink-0 bg-dark-800 border-r border-white/10">
      <div className="p-6 border-b border-white/10"><Link to="/admin" className="text-xl font-black text-white">Fuel<span className="text-primary">Finder</span> <span className="text-xs text-primary">Admin</span></Link></div>
      <nav className="p-4 space-y-1">
        {[{to:"/admin",l:"📊 Dashboard"},{to:"/admin/stations",l:"⛽ Stations"},{to:"/admin/prices",l:"💰 Prices"},{to:"/admin/users",l:"👥 Users"},{to:"/admin/reports",l:"📈 Reports"},{to:"/admin/profile",l:"👤 Profile"}].map(n=>(
          <Link key={n.to} to={n.to} className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-all font-medium text-sm">{n.l}</Link>
        ))}
      </nav>
    </aside>
  );
}

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/reports").then((r) => setReports(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminNav />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-black text-white mb-6">Reports</h1>
        {loading ? <p className="text-slate-400">Loading…</p> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Stations", value: reports?.total_stations, color: "text-white" },
                { label: "Active Stations", value: reports?.active_stations, color: "text-green-400" },
                { label: "Inactive", value: reports?.inactive_stations, color: "text-red-400" },
                { label: "Total Users", value: reports?.total_users, color: "text-cyan-400" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-6">
                  <p className="text-slate-400 text-sm mb-2">{s.label}</p>
                  <p className={`text-4xl font-black ${s.color}`}>{s.value ?? 0}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Price Update Log</h2>
                <span className="text-xs text-slate-500">Last 10 updates</span>
              </div>
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
          </>
        )}
      </main>
    </div>
  );
}
