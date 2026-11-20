import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Navigation, Flag } from "lucide-react";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import { formatDate, peso, distanceToStation } from "../../utils/format";

const FUEL_META = {
  "Unleaded 91": { accent: "#fb923c", dot: "bg-orange-400", badge: "bg-orange-500/10 text-orange-300 border-orange-500/25" },
  U91: { accent: "#fb923c", dot: "bg-orange-400", badge: "bg-orange-500/10 text-orange-300 border-orange-500/25" },
  Gasoline: { accent: "#fb923c", dot: "bg-orange-400", badge: "bg-orange-500/10 text-orange-300 border-orange-500/25" },
  Diesel: { accent: "#22d3ee", dot: "bg-cyan-400", badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25" },
  DIESEL: { accent: "#22d3ee", dot: "bg-cyan-400", badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25" },
  "Premium 95": { accent: "#c084fc", dot: "bg-violet-400", badge: "bg-violet-500/10 text-violet-300 border-violet-500/25" },
  P95: { accent: "#c084fc", dot: "bg-violet-400", badge: "bg-violet-500/10 text-violet-300 border-violet-500/25" },
  "Premium Gasoline": { accent: "#c084fc", dot: "bg-violet-400", badge: "bg-violet-500/10 text-violet-300 border-violet-500/25" },
};

/**
 * Builds a Google Maps URLs (api=1) directions link to the station.
 * No origin is set, so Google Maps starts navigation from the user's
 * current location (on mobile it opens the Google Maps app if installed).
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
function googleMapsDirectionsUrl(station) {
  const params = new URLSearchParams({
    api: "1",
    destination: `${station.latitude},${station.longitude}`,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function StationDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [coords, setCoords] = useState(() => {
    const raw = location.state?.userLocation;
    const lat = Number(raw?.lat);
    const lng = Number(raw?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });

  useEffect(() => {
    if (coords || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 },
    );
  }, [coords]);

  const { data: station, loading, error, reload } = useApiData(`/api/stations/${id}`);
  const displayDistance = station ? (distanceToStation(coords, station) ?? station.distance_km) : null;

  return (
    <div className="ff-user min-h-dvh bg-[#090B10] text-[#F8FAFC] flex flex-col overflow-x-hidden pb-safe">
      {/* Sticky header */}
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
            {station?.name || "Station Details"}
          </span>
        </div>
      </nav>

      <main className="w-full max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-9 space-y-6 min-w-0">
        {error ? (
          <div className="space-y-3">
            <ErrorBlock message={error} onRetry={reload} />
            <button type="button" onClick={() => navigate("/dashboard")} className="btn-secondary text-sm min-h-11 px-4">
              Back to Map
            </button>
          </div>
        ) : loading && !station ? (
          <div className="space-y-4">
            <LoadingBlock count={2} className="h-44" label="Loading station details…" />
          </div>
        ) : station ? (
          <>
            {/* Station hero summary */}
            <section className="rounded-2xl bg-[#111520] border border-white/[0.07] p-5 sm:p-7 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {station.brand && (
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-orange-400 mb-2">
                      {station.brand}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tighter leading-[1.1] break-words">
                    {station.name}
                  </h1>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-xs font-semibold capitalize ${
                  station.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                }`}>
                  {station.status}
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <p className="text-slate-300 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="min-w-0 break-words leading-relaxed">
                    {station.address}
                    {(station.barangay || station.city) && (
                      <span className="block text-xs text-[#94A3B8] mt-0.5">
                        {[station.barangay, station.city].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </span>
                </p>

                {station.contact_info && (
                  <p className="text-slate-300 flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
                    <a
                      href={`tel:${station.contact_info.replace(/[^\d+]/g, "")}`}
                      className="hover:text-[#F8FAFC] underline-offset-2 hover:underline py-1"
                    >
                      {station.contact_info}
                    </a>
                  </p>
                )}

                {displayDistance != null && (
                  <p className="text-cyan-400 text-xs font-medium flex items-center gap-2.5 pt-0.5">
                    <Navigation className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>{displayDistance} km away</span>
                  </p>
                )}
              </div>

              {/* Primary Google Maps action */}
              <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <a
                  href={googleMapsDirectionsUrl(station)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Get directions to ${station.name} in Google Maps`}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-semibold text-sm w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
                >
                  <Navigation className="w-4 h-4" aria-hidden="true" /> Open in Maps
                </a>

                <Link
                  to={`/feedback?category=${encodeURIComponent("Price Report")}&station_id=${station.station_id}`}
                  className="min-h-11 px-3 text-sm text-[#94A3B8] hover:text-[#F8FAFC] inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Report a wrong price
                </Link>
              </div>
            </section>

            {/* Fuel Prices — clean divided list without box-in-box clutter */}
            <section className="rounded-2xl bg-[#111520] border border-white/[0.07] overflow-hidden">
              <div className="px-5 sm:px-7 py-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
                <h2 className="text-[#F8FAFC] font-bold tracking-tight text-base sm:text-lg">
                  Current Pump Prices
                </h2>
                <span className="text-xs text-[#94A3B8]">Per liter (PHP)</span>
              </div>

              {station.fuel_prices?.length === 0 ? (
                <div className="p-5">
                  <EmptyBlock message="No fuel prices listed for this station yet." />
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.06]">
                  {station.fuel_prices?.map((p) => {
                    const meta = FUEL_META[p.fuel_type] || {
                      accent: "#94a3b8",
                      dot: "bg-slate-400",
                      badge: "bg-white/5 text-slate-300 border-white/10",
                    };
                    return (
                      <li
                        key={p.price_id}
                        className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} aria-hidden="true" />
                            <span className="text-sm sm:text-base font-semibold text-[#F8FAFC]">
                              {p.fuel_type}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">
                            Updated {formatDate(p.date_updated)} · {p.time_updated?.slice(0, 5)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums" style={{ color: meta.accent }}>
                            {peso(p.price_per_liter)}
                          </p>
                          <p className="text-[11px] text-slate-500">per liter</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
