import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Award, ArrowRight } from "lucide-react";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import { FUEL_OPTIONS, formatDate, peso } from "../../utils/format";

function getPrice(station, fuelType) {
  const p = station.fuel_prices?.find(
    (fp) =>
      (fp.fuel_type === fuelType ||
        (fuelType === "Unleaded 91" && fp.fuel_type === "Gasoline") ||
        (fuelType === "Premium 95" && fp.fuel_type === "Premium Gasoline")) &&
      fp.status === "active",
  );
  return p ? parseFloat(p.price_per_liter) : null;
}

export default function Compare() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ids = params.get("ids") || "";

  const { data, loading, error, reload } = useApiData(
    "/api/stations/compare",
    ids ? { ids } : undefined,
  );
  const stations = ids ? (data ?? []) : [];

  const bestFor = (fuelType) => {
    const entries = stations
      .map((s) => ({ station: s, price: getPrice(s, fuelType) }))
      .filter((x) => x.price != null);
    if (!entries.length) return null;
    const min = Math.min(...entries.map((x) => x.price));
    return { min, count: entries.length, winner: entries.find((x) => x.price === min)?.station };
  };

  const lastUpdatedOf = (s) => {
    const d = s.fuel_prices?.[0]?.date_updated;
    return d ? formatDate(d) : "—";
  };

  return (
    <div className="min-h-dvh bg-dark-900 flex flex-col">
      <nav className="sticky top-0 z-20 bg-dark-800/90 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-slate-300 hover:text-white transition-colors text-sm h-9 px-2.5 -ml-2 rounded-lg hover:bg-dark-700 inline-flex items-center gap-1.5 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>
          <span className="text-white font-bold text-base sm:text-lg truncate">Price Comparison</span>
        </div>
        {stations.length > 0 && (
          <span className="text-xs text-slate-400 flex-shrink-0">
            {stations.length} station{stations.length !== 1 ? "s" : ""}
          </span>
        )}
      </nav>

      <main className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {!ids ? (
          <div className="space-y-3">
            <EmptyBlock message="Pick 2 to 4 stations from the map to compare their pump prices." />
            <button type="button" onClick={() => navigate("/dashboard")} className="btn-primary text-sm h-9 px-4">
              Browse Map
            </button>
          </div>
        ) : error ? (
          <ErrorBlock message={error} onRetry={reload} />
        ) : loading && !data ? (
          <div className="space-y-3">
            <LoadingBlock count={3} className="h-36" label="Loading comparison…" />
          </div>
        ) : stations.length === 0 ? (
          <EmptyBlock message="None of those stations could be loaded." />
        ) : (
          <>
            {/* Lowest price summary */}
            <section aria-label="Lowest prices" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FUEL_OPTIONS.map((ft) => {
                const best = bestFor(ft);
                return (
                  <div key={ft} className="glass-card p-3.5 sm:p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">{ft}</p>
                      <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                        {best ? best.winner?.name : "No prices"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-black tabular-nums ${best ? "text-success" : "text-slate-600"}`}>
                        {best ? peso(best.min) : "—"}
                      </p>
                      {best && <p className="text-[10px] text-success/80 uppercase tracking-wide font-semibold">Lowest</p>}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Mobile: one card per station */}
            <div className="md:hidden space-y-3">
              {stations.map((s) => (
                <article key={s.station_id} className="glass-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-white text-base leading-snug break-words">{s.name}</h2>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {[s.brand, s.barangay].filter(Boolean).join(" · ") || "Taguig City"}
                      </p>
                    </div>
                    {s.distance_km != null && (
                      <span className="flex-shrink-0 text-[11px] text-accent font-semibold bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full tabular-nums">
                        {s.distance_km} km
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {FUEL_OPTIONS.map((ft) => {
                      const price = getPrice(s, ft);
                      const best = bestFor(ft);
                      const isCheapest = price != null && best && best.count > 1 && price === best.min;
                      return (
                        <div
                          key={ft}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 border ${
                            isCheapest
                              ? "bg-success/10 border-success/25"
                              : "bg-dark-800/80 border-white/5"
                          }`}
                        >
                          <span className="text-xs sm:text-sm text-slate-300">{ft}</span>
                          {price != null ? (
                            <span className={`font-bold text-sm tabular-nums inline-flex items-center gap-1.5 ${isCheapest ? "text-success" : "text-white"}`}>
                              {isCheapest && <Award className="w-3.5 h-3.5" aria-hidden="true" />}
                              {peso(price)}
                              {isCheapest && <span className="text-[11px] font-semibold">Best</span>}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">N/A</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">Updated {lastUpdatedOf(s)}</span>
                    <Link
                      to={`/dashboard/station/${s.station_id}`}
                      className="text-xs font-semibold text-primary hover:text-primary-light inline-flex items-center gap-1"
                    >
                      View station <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Tablet / desktop: table */}
            <div className="hidden md:block glass-card overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-white/10 bg-dark-800/40">
                  <tr>
                    <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Station</th>
                    <th className="text-center px-4 py-3.5 text-slate-400 font-medium">Distance</th>
                    {FUEL_OPTIONS.map((ft) => (
                      <th key={ft} className="text-center px-4 py-3.5 text-slate-400 font-medium">{ft}</th>
                    ))}
                    <th className="text-center px-4 py-3.5 text-slate-400 font-medium">Updated</th>
                    <th className="text-right px-4 py-3.5 text-slate-400 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr key={s.station_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-white">{s.name}</p>
                        <p className="text-xs text-slate-500">{[s.brand, s.barangay].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center tabular-nums">
                        {s.distance_km != null ? (
                          <span className="text-accent font-medium">{s.distance_km} km</span>
                        ) : "—"}
                      </td>
                      {FUEL_OPTIONS.map((ft) => {
                        const price = getPrice(s, ft);
                        const best = bestFor(ft);
                        const isCheapest = price != null && best && best.count > 1 && price === best.min;
                        return (
                          <td key={ft} className="px-4 py-3.5 text-center tabular-nums">
                            {price != null ? (
                              <div className={`font-bold text-base ${isCheapest ? "text-success" : "text-white"}`}>
                                {peso(price)}
                                {isCheapest && <span className="block text-[11px] font-semibold text-success">Best</span>}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-sm">N/A</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3.5 text-center text-xs text-slate-500">{lastUpdatedOf(s)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <Link to={`/dashboard/station/${s.station_id}`} className="btn-secondary text-xs px-3 py-1.5">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
