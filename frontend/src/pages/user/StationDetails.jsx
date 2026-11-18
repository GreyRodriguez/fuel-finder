import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Navigation, Flag, Fuel } from "lucide-react";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import { formatDate, peso } from "../../utils/format";

const FUEL_META = {
  "Unleaded 91": { accent: "#f97316", badge: "bg-primary/10 text-primary border-primary/25" },
  U91: { accent: "#f97316", badge: "bg-primary/10 text-primary border-primary/25" },
  Gasoline: { accent: "#f97316", badge: "bg-primary/10 text-primary border-primary/25" },
  Diesel: { accent: "#06b6d4", badge: "bg-accent/10 text-accent border-accent/25" },
  DIESEL: { accent: "#06b6d4", badge: "bg-accent/10 text-accent border-accent/25" },
  "Premium 95": { accent: "#a855f7", badge: "bg-purple-500/10 text-purple-300 border-purple-500/25" },
  P95: { accent: "#a855f7", badge: "bg-purple-500/10 text-purple-300 border-purple-500/25" },
  "Premium Gasoline": { accent: "#a855f7", badge: "bg-purple-500/10 text-purple-300 border-purple-500/25" },
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
  const navigate = useNavigate();
  const { data: station, loading, error, reload } = useApiData(`/api/stations/${id}`);

  return (
    <div className="min-h-dvh bg-dark-900 flex flex-col">
      {/* Sticky header */}
      <nav className="sticky top-0 z-20 bg-dark-800/90 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-slate-300 hover:text-white transition-colors text-sm h-9 px-2.5 -ml-2 rounded-lg hover:bg-dark-700 inline-flex items-center gap-1.5 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Map</span>
          </button>
          <span className="text-white font-bold text-base sm:text-lg truncate">
            {station?.name || "Station Details"}
          </span>
        </div>
      </nav>

      <main className="w-full max-w-2xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">
        {error ? (
          <div className="space-y-3">
            <ErrorBlock message={error} onRetry={reload} />
            <button type="button" onClick={() => navigate("/dashboard")} className="btn-secondary text-sm h-9 px-4">
              Back to Map
            </button>
          </div>
        ) : loading && !station ? (
          <div className="space-y-4">
            <LoadingBlock count={2} className="h-44" label="Loading station details…" />
          </div>
        ) : station ? (
          <>
            {/* Station hero card */}
            <section className="glass-card p-4 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {station.brand && (
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full mb-2">
                      {station.brand}
                    </span>
                  )}
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-snug break-words">
                    {station.name}
                  </h1>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${
                  station.status === "active"
                    ? "bg-success/10 text-success border-success/25"
                    : "bg-danger/10 text-danger border-danger/25"
                }`}>
                  {station.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-slate-300 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="min-w-0 break-words">
                    {station.address}
                    {(station.barangay || station.city) && (
                      <span className="block text-xs text-slate-400 mt-0.5">
                        {[station.barangay, station.city].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </span>
                </p>

                {station.contact_info && (
                  <p className="text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
                    <a href={`tel:${station.contact_info.replace(/[^\d+]/g, "")}`} className="hover:text-white underline-offset-2 hover:underline">
                      {station.contact_info}
                    </a>
                  </p>
                )}

                {station.distance_km != null && (
                  <p className="text-accent text-xs font-semibold flex items-center gap-2 pt-0.5">
                    <Navigation className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>{station.distance_km} km away</span>
                  </p>
                )}
              </div>

              {/* Primary Google Maps action */}
              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                <a
                  href={googleMapsDirectionsUrl(station)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Get directions to ${station.name} in Google Maps`}
                  className="btn-primary h-10 px-5 text-sm gap-2 w-full sm:w-auto"
                >
                  <Navigation className="w-4 h-4" aria-hidden="true" /> Open in Maps
                </a>

                <Link
                  to={`/feedback?category=${encodeURIComponent("Price Report")}&station_id=${station.station_id}`}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 py-1.5 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Report a wrong price
                </Link>
              </div>
            </section>

            {/* Fuel Prices */}
            <section className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Fuel className="w-4 h-4 text-primary" aria-hidden="true" />
                <h2 className="text-white font-bold text-base sm:text-lg">Fuel Prices</h2>
              </div>

              {station.fuel_prices?.length === 0 ? (
                <EmptyBlock message="No fuel prices listed for this station yet." />
              ) : (
                <ul className="space-y-2.5">
                  {station.fuel_prices?.map((p) => {
                    const meta = FUEL_META[p.fuel_type] || { accent: "#94a3b8", badge: "bg-white/5 text-slate-300 border-white/10" };
                    return (
                      <li
                        key={p.price_id}
                        className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-dark-800/80 border border-white/5"
                      >
                        <div className="min-w-0">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold ${meta.badge}`}>
                            {p.fuel_type}
                          </span>
                          <p className="text-xs text-slate-500 mt-1.5">
                            Updated {formatDate(p.date_updated)} · {p.time_updated?.slice(0, 5)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: meta.accent }}>
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
