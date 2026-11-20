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
    const max = Math.max(...entries.map((x) => x.price));
    return {
      min,
      spread: max - min,
      count: entries.length,
      winner: entries.find((x) => x.price === min)?.station,
    };
  };

  const lastUpdatedOf = (s) => {
    const d = s.fuel_prices?.[0]?.date_updated;
    return d ? formatDate(d) : "—";
  };

  return (
    <div className="ff-user min-h-dvh bg-[#090B10] text-[#F8FAFC] flex flex-col overflow-x-hidden pb-safe">
      <nav className="sticky top-0 z-20 bg-[#090B10]/80 backdrop-blur-md border-b border-white/[0.06] px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors text-sm min-h-11 px-3 -ml-2 rounded-xl hover:bg-white/[0.05] inline-flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Map</span>
          </button>
          <span className="text-[#F8FAFC] font-bold tracking-tight text-base sm:text-lg truncate">
            Price Comparison
          </span>
        </div>
        {stations.length > 0 && (
          <span className="text-xs font-medium text-[#94A3B8] flex-shrink-0">
            {stations.length} station{stations.length !== 1 ? "s" : ""}
          </span>
        )}
      </nav>

      <main className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-9 space-y-6 md:space-y-8 min-w-0">
        {!ids ? (
          <div className="space-y-4">
            <EmptyBlock message="Pick 2 to 4 stations from the map to compare their pump prices." />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn-primary text-sm min-h-11 px-6"
              >
                Browse Map
              </button>
            </div>
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
            {/* Lowest price summary — clean divided strip */}
            <section
              aria-label="Lowest prices"
              className="rounded-2xl bg-[#111520] border border-white/[0.07] overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.07]">
                {FUEL_OPTIONS.map((ft) => {
                  const best = bestFor(ft);
                  return (
                    <div key={ft} className="p-4 sm:p-5 flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">{ft}</p>
                        <p className="text-sm text-[#F8FAFC] font-medium truncate mt-1">
                          {best ? best.winner?.name : "No prices"}
                        </p>
                        {best && best.spread > 0 && (
                          <p className="text-xs text-emerald-400 mt-0.5 tabular-nums">
                            Save up to {peso(best.spread)}/L
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xl font-extrabold tracking-tight tabular-nums ${best ? "text-emerald-400" : "text-slate-600"}`}>
                          {best ? peso(best.min) : "—"}
                        </p>
                        {best && (
                          <p className="text-[11px] text-emerald-400/80 uppercase tracking-wide font-semibold">
                            Lowest
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Mobile: one clean surface card per station */}
            <div className="md:hidden space-y-3">
              {stations.map((s) => (
                <article
                  key={s.station_id}
                  className="rounded-2xl bg-[#111520] border border-white/[0.07] p-4 space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-[#F8FAFC] text-base leading-snug break-words">{s.name}</h2>
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">
                        {[s.brand, s.barangay].filter(Boolean).join(" · ") || "Taguig City"}
                      </p>
                    </div>
                    {s.distance_km != null && (
                      <span className="flex-shrink-0 text-xs text-cyan-400 font-medium bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full tabular-nums">
                        {s.distance_km} km
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl bg-[#090B10]/70 border border-white/[0.05] divide-y divide-white/[0.05] overflow-hidden">
                    {FUEL_OPTIONS.map((ft) => {
                      const price = getPrice(s, ft);
                      const best = bestFor(ft);
                      const isCheapest = price != null && best && best.count > 1 && price === best.min;
                      return (
                        <div
                          key={ft}
                          className={`flex items-center justify-between px-3.5 py-2.5 ${
                            isCheapest ? "bg-emerald-500/[0.07]" : ""
                          }`}
                        >
                          <span className="text-sm text-[#94A3B8]">{ft}</span>
                          {price != null ? (
                            <span className={`font-bold text-sm tabular-nums inline-flex items-center gap-1.5 ${isCheapest ? "text-emerald-400" : "text-[#F8FAFC]"}`}>
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

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">Updated {lastUpdatedOf(s)}</span>
                    <Link
                      to={`/dashboard/station/${s.station_id}`}
                      className="min-h-11 px-3 -mr-2 text-sm font-semibold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1.5 transition-colors"
                    >
                      View station <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Tablet / desktop: comparison table */}
            <div className="hidden md:block rounded-2xl bg-[#111520] border border-white/[0.07] overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-white/[0.07] bg-[#0D1018]/70">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-[#94A3B8] font-medium">Station</th>
                    <th className="text-center px-4 py-3.5 text-xs uppercase tracking-wider text-[#94A3B8] font-medium">Distance</th>
                    {FUEL_OPTIONS.map((ft) => (
                      <th key={ft} className="text-center px-4 py-3.5 text-xs uppercase tracking-wider text-[#94A3B8] font-medium">{ft}</th>
                    ))}
                    <th className="text-center px-4 py-3.5 text-xs uppercase tracking-wider text-[#94A3B8] font-medium">Updated</th>
                    <th className="text-right px-5 py-3.5 text-xs uppercase tracking-wider text-[#94A3B8] font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {stations.map((s) => (
                    <tr key={s.station_id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#F8FAFC]">{s.name}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{[s.brand, s.barangay].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className="px-4 py-4 text-center tabular-nums">
                        {s.distance_km != null ? (
                          <span className="text-cyan-400 font-medium">{s.distance_km} km</span>
                        ) : "—"}
                      </td>
                      {FUEL_OPTIONS.map((ft) => {
                        const price = getPrice(s, ft);
                        const best = bestFor(ft);
                        const isCheapest = price != null && best && best.count > 1 && price === best.min;
                        return (
                          <td key={ft} className="px-4 py-4 text-center tabular-nums">
                            {price != null ? (
                              <div className={`font-bold text-base ${isCheapest ? "text-emerald-400" : "text-[#F8FAFC]"}`}>
                                {peso(price)}
                                {isCheapest && (
                                  <span className="block text-[11px] font-semibold text-emerald-400/90 mt-0.5">
                                    Lowest
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-sm">N/A</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center text-xs text-slate-500">{lastUpdatedOf(s)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/dashboard/station/${s.station_id}`}
                          className="btn-secondary text-xs min-h-11 px-3.5"
                        >
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
