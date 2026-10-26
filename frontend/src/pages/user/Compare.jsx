import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const fuelTypes = ["Unleaded 91", "Diesel", "Premium 95"];

export default function Compare() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ids = params.get("ids") || "";
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids) { navigate("/dashboard"); return; }
    api.get(`/api/stations/compare?ids=${ids}`)
      .then((r) => setStations(r.data))
      .finally(() => setLoading(false));
  }, [ids]);

  const getPrice = (station, fuelType) => {
    const p = station.fuel_prices?.find(
      (fp) =>
        (fp.fuel_type === fuelType ||
          (fuelType === "Unleaded 91" && fp.fuel_type === "Gasoline") ||
          (fuelType === "Premium 95" && fp.fuel_type === "Premium Gasoline")) &&
        fp.status === "active"
    );
    return p ? parseFloat(p.price_per_liter) : null;
  };

  const cheapestForType = (fuelType) => {
    const prices = stations.map((s) => getPrice(s, fuelType)).filter(Boolean);
    return Math.min(...prices);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="bg-dark-800 border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Back
        </button>
        <span className="text-white font-bold text-lg">Price Comparison</span>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        {loading ? (
          <p className="text-slate-400 text-center py-12">Loading comparison…</p>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-6">Comparing {stations.length} station{stations.length !== 1 ? "s" : ""}</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">Station</th>
                    <th className="text-center p-4 text-slate-400 text-sm font-medium">Distance</th>
                    {fuelTypes.map((ft) => (
                      <th key={ft} className="text-center p-4 text-slate-400 text-sm font-medium">{ft}</th>
                    ))}
                    <th className="text-center p-4 text-slate-400 text-sm font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {stations.map((s) => {
                    const lastUpdated = s.fuel_prices?.[0]?.date_updated || "—";
                    return (
                      <tr key={s.station_id} className="glass-card mb-2 block" style={{ marginBottom: "0.5rem" }}>
                        <td className="p-4">
                          <p className="font-semibold text-white">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.brand} · {s.barangay}</p>
                        </td>
                        <td className="p-4 text-center">
                          {s.distance_km ? (
                            <span className="text-accent font-medium">{s.distance_km} km</span>
                          ) : "—"}
                        </td>
                        {fuelTypes.map((ft) => {
                          const price = getPrice(s, ft);
                          const cheapest = cheapestForType(ft);
                          const isCheapest = price !== null && price === cheapest;
                          return (
                            <td key={ft} className="p-4 text-center">
                              {price !== null ? (
                                <div className={`font-bold text-lg ${isCheapest ? "text-green-400" : "text-white"}`}>
                                  ₱{price.toFixed(2)}
                                  {isCheapest && <span className="block text-xs font-normal text-green-400">Cheapest</span>}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-sm">N/A</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-4 text-center text-xs text-slate-500">{lastUpdated}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
