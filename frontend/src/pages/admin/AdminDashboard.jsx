import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card p-6">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/reports").then((r) => setReports(r.data)).finally(() => setLoading(false));
  }, []);

  const navLinks = [
    { to: "/admin", label: "Dashboard", icon: "📊" },
    { to: "/admin/stations", label: "Stations", icon: "⛽" },
    { to: "/admin/prices", label: "Fuel Prices", icon: "💰" },
    { to: "/admin/users", label: "Users", icon: "👥" },
    { to: "/admin/reports", label: "Reports", icon: "📈" },
    { to: "/admin/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-dark-800 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="text-xl font-black text-white">
            Fuel<span className="text-primary">Finder</span>
            <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-all"
            >
              <span>{l.icon}</span>
              <span className="font-medium">{l.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-2">{user?.full_name}</p>
          <button onClick={logout} className="btn-danger w-full text-sm py-2">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-black text-white mb-8">Dashboard Overview</h1>

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
