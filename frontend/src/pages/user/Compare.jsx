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

  const lastUpdatedOf = (s) => s.fuel_prices?.[0]?.date_updated || "—";

  return (
    <div className="min-h-dvh bg-dark-900">
      <nav className="bg-dark-800 border-b border-white/10 px-4 md:px-6 py-3 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white transition-colors text-sm py-2 pr-2">
          ← Back
        </button>
        <span className="text-white font-bold text-lg">Price Comparison</span>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {loading ? (
          <p className="text-slate-400 text-center py-12">Loading comparison…</p>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4 md:mb-6">Comparing {stations.length} station{stations.length !== 1 ? "s" : ""}</p>

            {/* Mobile: one card per station */}
            <div className="md:hidden space-y-3">
              {stations.map((s) => (
                <div key={s.station_id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.brand} · {s.barangay}</p>
                    </div>
                    {s.distance_km ? (
                      <span className="flex-shrink-0 text-xs text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-full">{s.distance_km} km</span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {fuelTypes.map((ft) => {
                      const price = getPrice(s, ft);
                      const isCheapest = price !== null && price === cheapestForType(ft);
                      return (
                        <div key={ft} className={`flex items-center justify-between rounded-xl px-3 py-2 ${isCheapest ? "bg-green-500/10 border border-green-500/20" : "bg-dark-600"}`}>
                          <span className="text-sm text-slate-300">{ft}</span>
                          {price !== null ? (
                            <span className={`font-bold ${isCheapest ? "text-green-400" : "text-white"}`}>
                              ₱{price.toFixed(2)}
                              {isCheapest && <span className="ml-2 text-xs font-normal">Cheapest</span>}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-sm">N/A</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Last updated: {lastUpdatedOf(s)}</p>
                </div>
              ))}
            </div>

            {/* Tablet / desktop: table */}
            <div className="hidden md:block overflow-x-auto">
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
                <tbody>
                  {stations.map((s) => (
                    <tr key={s.station_id} className="border-b border-white/5">
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
                        const isCheapest = price !== null && price === cheapestForType(ft);
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
                      <td className="p-4 text-center text-xs text-slate-500">{lastUpdatedOf(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
