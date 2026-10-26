import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const fuelTypeColor = {
  "Unleaded 91": "#f97316",
  U91: "#f97316",
  Gasoline: "#f97316",
  Diesel: "#06b6d4",
  DIESEL: "#06b6d4",
  "Premium 95": "#a855f7",
  P95: "#a855f7",
  "Premium Gasoline": "#a855f7"
};

export default function StationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/stations/${id}`)
      .then((r) => setStation(r.data))
      .catch(() => navigate("/dashboard"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <p className="text-slate-400">Loading station details…</p>
    </div>
  );

  if (!station) return null;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navbar */}
      <nav className="bg-dark-800 border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Back to Map
        </button>
        <span className="text-white font-bold text-lg">Station Details</span>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header card */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-white">{station.name}</h1>
              <p className="text-primary font-semibold">{station.brand}</p>
              <p className="text-slate-400 text-sm mt-1">{station.address}</p>
              {station.barangay && <p className="text-slate-500 text-xs">{station.barangay}, {station.city}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              station.status === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400"
            }`}>
              {station.status}
            </span>
          </div>
          {station.contact_info && (
            <p className="text-slate-400 text-sm">📞 {station.contact_info}</p>
          )}
          {station.distance_km && (
            <p className="text-accent text-sm font-medium mt-1">📍 {station.distance_km} km away</p>
          )}
        </div>

        {/* Fuel Prices */}
        <div className="glass-card p-6">
          <h2 className="text-white font-bold text-lg mb-4">Fuel Prices</h2>
          {station.fuel_prices?.length === 0 && (
            <p className="text-slate-500 text-sm">No prices listed yet.</p>
          )}
          <div className="space-y-3">
            {station.fuel_prices?.map((p) => (
              <div key={p.price_id} className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: `${fuelTypeColor[p.fuel_type] || "#6b7280"}12` }}>
                <div>
                  <p className="font-semibold text-white">{p.fuel_type}</p>
                  <p className="text-xs text-slate-500">Updated: {p.date_updated} {p.time_updated}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black" style={{ color: fuelTypeColor[p.fuel_type] || "#6b7280" }}>
                    ₱{Number(p.price_per_liter).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">per liter</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a
            href={`https://www.openstreetmap.org/?mlat=${station.latitude}&mlon=${station.longitude}&zoom=17`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary flex-1 text-center py-3"
          >
            🗺️ Open in Maps
          </a>
          <Link to={`/dashboard/compare?ids=${id}`} className="btn-secondary flex-1 text-center py-3">
            Compare Prices
          </Link>
        </div>
      </div>
    </div>
  );
}
