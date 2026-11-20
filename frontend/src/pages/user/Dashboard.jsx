import { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import {
  Search, LocateFixed, TrendingDown, Check, Plus, ArrowRight, GitCompare, X, MapPin,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AppHeader from "../../components/AppHeader";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../components/DataStates";
import useMediaQuery, { MOBILE_QUERY } from "../../hooks/useMediaQuery";
import api from "../../services/api";
import { peso } from "../../utils/format";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TAGUIG_CENTER = [14.5243, 121.0792];
const MOVE_REFETCH_KM = 0.25; // reload nearby stations once the user has moved this far

// "You are here" pin: blue dot with a white ring
const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;background:#3b82f6;border:3px solid #fff;
    border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.35),0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Mobile bottom-sheet snap points, smallest → largest
const SNAP_ORDER = ["peek", "half", "full"];
const SHEET_TOP_GAP = 12; // px of map left visible above a fully-open sheet

/** CSS height for a snap state. "peek" = just the sheet header (handle + search). */
const snapToCss = (state, headerEl) => {
  if (state === "peek") return `${headerEl?.offsetHeight ?? 176}px`;
  if (state === "half") return "50%";
  return `calc(100% - ${SHEET_TOP_GAP}px)`;
};

const createStationIcon = (isSelected) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;background:${isSelected ? "#f97316" : "#111520"};
      border:2.5px solid ${isSelected ? "#fff7ed" : "#f97316"};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      box-shadow:0 6px 16px rgba(0,0,0,0.45);
      display:flex;align-items:center;justify-content:center;
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

function fuelColor(type) {
  if (type === "Gasoline" || type === "Unleaded 91" || type === "U91") {
    return { text: "text-orange-400", dot: "bg-orange-400" };
  }
  if (type === "Diesel" || type === "DIESEL") {
    return { text: "text-cyan-400", dot: "bg-cyan-400" };
  }
  return { text: "text-violet-300", dot: "bg-violet-400" };
}

function PriceTag({ label, price, type }) {
  const c = fuelColor(type);
  return (
    <div className="flex justify-between items-center py-1 gap-2">
      <span className="text-xs text-[#94A3B8] inline-flex items-center gap-2 min-w-0 truncate">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${c.text}`}>
        {peso(price)}<span className="text-[11px] font-normal text-slate-500">/L</span>
      </span>
    </div>
  );
}

/** Great-circle distance between two lat/lng points, in kilometers. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [stations, setStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("nearest");
  const [selected, setSelected] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sheet, setSheet] = useState("half");

  const wrapRef = useRef(null);        // holds the --sheet-h CSS variable
  const sheetHeaderRef = useRef(null); // measured for the "peek" height
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const dragRef = useRef(null);
  const lastFetchRef = useRef(null);   // position the station list was last loaded for
  const centeredRef = useRef(false);   // map has been moved to the user's first fix

  const fetchStations = useCallback(async (lat, lng) => {
    setLoadError("");
    try {
      const res = await api.get(`/api/stations/?lat=${lat}&lng=${lng}&radius=15`);
      setStations(res.data);
    } catch {
      setLoadError("Couldn't load nearby stations. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Track the user's live position. Nothing is stored: every visit asks the device for a fresh fix
  // (maximumAge: 0 forbids cached positions), so the pin always reflects where the user is now.
  useEffect(() => {
    const fallback = () => {
      if (lastFetchRef.current) return;
      lastFetchRef.current = { lat: TAGUIG_CENTER[0], lng: TAGUIG_CENTER[1] };
      fetchStations(TAGUIG_CENTER[0], TAGUIG_CENTER[1]);
    };
    if (!navigator.geolocation) { fallback(); return; }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setUserLocation(loc);

        const last = lastFetchRef.current;
        if (!last || haversineKm(last.lat, last.lng, loc.lat, loc.lng) > MOVE_REFETCH_KM) {
          lastFetchRef.current = loc;
          fetchStations(loc.lat, loc.lng);
        }

        // MapContainer's `center` only applies on mount, so move the map to the user once
        if (!centeredRef.current && mapRef.current) {
          centeredRef.current = true;
          mapRef.current.flyTo([loc.lat, loc.lng], 15, { duration: 0.8 });
        }
      },
      fallback,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [fetchStations]);

  // ── Bottom sheet (mobile only; CSS ignores --sheet-h at ≥768px) ──────────
  const applySnap = useCallback((state) => {
    wrapRef.current?.style.setProperty("--sheet-h", snapToCss(state, sheetHeaderRef.current));
    setSheet(state);
  }, []);

  useLayoutEffect(() => {
    const set = () => wrapRef.current?.style.setProperty("--sheet-h", snapToCss(sheet, sheetHeaderRef.current));
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, [sheet]);

  const cycleSheet = () => applySnap(SNAP_ORDER[(SNAP_ORDER.indexOf(sheet) + 1) % SNAP_ORDER.length]);

  const onDragStart = (e) => {
    if (!isMobile || (e.pointerType === "mouse" && e.button !== 0)) return;
    const wrap = wrapRef.current;
    const sheetEl = e.currentTarget.closest(".ff-sheet");
    dragRef.current = {
      startY: e.clientY,
      startH: sheetEl.offsetHeight,
      minH: sheetHeaderRef.current.offsetHeight,
      maxH: wrap.clientHeight - SHEET_TOP_GAP,
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    wrap.dataset.dragging = "";
  };

  const onDragMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > 5) d.moved = true;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    const h = Math.min(d.maxH, Math.max(d.minH, d.startH - dy));
    wrapRef.current.style.setProperty("--sheet-h", `${h}px`);
  };

  const onDragEnd = (e) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    delete wrapRef.current.dataset.dragging;

    if (!d.moved) return cycleSheet(); // treat as a tap on the handle

    const points = { peek: d.minH, half: wrapRef.current.clientHeight * 0.5, full: d.maxH };
    const cur = Math.min(d.maxH, Math.max(d.minH, d.startH - (d.lastY - d.startY)));
    const velocity = e.timeStamp - d.lastT > 120 ? 0 : d.v;
    let target;
    if (Math.abs(velocity) > 0.4) {
      target = velocity < 0
        ? SNAP_ORDER.find((s) => points[s] > cur + 1) ?? "full"
        : [...SNAP_ORDER].reverse().find((s) => points[s] < cur - 1) ?? "peek";
    } else {
      target = SNAP_ORDER.reduce((best, s) =>
        Math.abs(points[s] - cur) < Math.abs(points[best] - cur) ? s : best, "peek");
    }
    applySnap(target);
  };

  const onHandleKey = (e) => {
    const i = SNAP_ORDER.indexOf(sheet);
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycleSheet(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); applySnap(SNAP_ORDER[Math.min(i + 1, 2)]); }
    else if (e.key === "ArrowDown") { e.preventDefault(); applySnap(SNAP_ORDER[Math.max(i - 1, 0)]); }
  };

  // ── Data / interactions ─────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) { setSearchResults(null); return; }
    setSearching(true);
    setLoadError("");
    try {
      const res = await api.get(`/api/stations/search?q=${encodeURIComponent(search.trim())}`);
      setSearchResults(res.data);
    } catch {
      setLoadError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSearchResults(null);
    setLoadError("");
  };

  const hasUserPosition =
    Number.isFinite(userLocation?.lat) && Number.isFinite(userLocation?.lng);

  // Derived: closest station to the user's position ({ station, distanceKm } or null)
  const nearest = useMemo(() => {
    if (!Number.isFinite(userLocation?.lat) || !Number.isFinite(userLocation?.lng)) return null;
    if (!Array.isArray(stations) || stations.length === 0) return null;
    let best = null;
    for (const s of stations) {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const d = haversineKm(userLocation.lat, userLocation.lng, lat, lng);
      if (best === null || d < best.distanceKm) best = { station: s, distanceKm: d };
    }
    return best;
  }, [userLocation, stations]);

  const displayed = searchResults ?? stations;

  const sorted = [...displayed].sort((a, b) => {
    if (filter === "nearest") return (a.distance_km ?? 999) - (b.distance_km ?? 999);
    const minPrice = (s) => Math.min(...(s.fuel_prices?.map((p) => p.price_per_liter) || [999]));
    return minPrice(a) - minPrice(b);
  });

  const toggleCompare = (id) => {
    setCompareList((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleCardClick = (s) => {
    if (!isMobile) {
      setSelected(s.station_id === selected ? null : s.station_id);
      return;
    }
    // Mobile: tuck the sheet away and fly the map to the station
    setSelected(s.station_id);
    applySnap("peek");
    const map = mapRef.current;
    if (!map) return;
    map.once("moveend", () => markerRefs.current[s.station_id]?.openPopup());
    map.flyTo([parseFloat(s.latitude), parseFloat(s.longitude)], Math.max(map.getZoom(), 16), { duration: 0.6 });
  };

  // Snap the map back to the user's blue dot
  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map || !hasUserPosition) return;
    const zoom = Math.max(map.getZoom(), 16);
    let target = L.latLng(userLocation.lat, userLocation.lng);
    if (isMobile) {
      const sheetPx = wrapRef.current?.querySelector(".ff-sheet")?.offsetHeight ?? 0;
      target = map.unproject(map.project(target, zoom).add([0, sheetPx / 2]), zoom);
    }
    map.flyTo(target, zoom, { duration: 0.6 });
  };

  const countLabel = loading
    ? "Loading stations…"
    : `${sorted.length} station${sorted.length !== 1 ? "s" : ""} ${searchResults ? "found" : "nearby"}`;

  return (
    <div className="ff-user h-dvh overflow-hidden bg-[#090B10] flex flex-col">
      <AppHeader
        actions={
          compareList.length > 0 && (
            <button
              id="compare-btn"
              type="button"
              onClick={() => navigate(`/dashboard/compare?ids=${compareList.join(",")}`)}
              aria-label={`Compare (${compareList.length})`}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <GitCompare className="w-4 h-4 min-[400px]:hidden md:hidden" aria-hidden="true" />
              <span className="hidden min-[400px]:inline md:inline">Compare </span>({compareList.length})
            </button>
          )
        }
      />

      <div ref={wrapRef} className="ff-sheet-wrap relative flex flex-1 overflow-hidden min-h-0">
        {/* Station list — desktop: left sidebar · mobile: draggable bottom sheet over the map */}
        <aside
          aria-label="Stations"
          className="ff-sheet absolute inset-x-0 bottom-0 z-20 rounded-t-3xl border-t shadow-[0_-16px_48px_rgba(0,0,0,0.65)]
                     md:relative md:inset-auto md:z-auto md:w-[400px] md:h-full md:rounded-none md:border-t-0 md:border-r md:shadow-none
                     flex-shrink-0 bg-[#0D1018]/95 backdrop-blur-xl border-white/[0.08] flex flex-col overflow-hidden min-h-0"
        >
          {/* Sheet header: drag handle (mobile) + Search & Filters */}
          <div ref={sheetHeaderRef} className="flex-shrink-0 border-b border-white/[0.06] bg-[#0D1018]/95 z-10">
            <div
              id="sheet-handle"
              role="button"
              tabIndex={0}
              aria-label={`Station list: ${sheet === "peek" ? "collapsed" : sheet === "half" ? "half open" : "fully open"}. Tap or drag to resize.`}
              aria-expanded={sheet !== "peek"}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              onKeyDown={onHandleKey}
              className="md:hidden touch-none select-none cursor-grab active:cursor-grabbing pt-3 pb-1.5 px-4 flex flex-col items-center gap-1.5"
            >
              <span className="block w-10 h-1 rounded-full bg-white/20" aria-hidden="true" />
              <span className="text-xs font-medium text-[#94A3B8]">{countLabel}</span>
            </div>

            <div className="px-3.5 pb-3.5 pt-1.5 md:p-4 space-y-2.5">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="station-search"
                    type="search"
                    enterKeyHint="search"
                    className="input-field min-h-11 pl-10 pr-10 text-sm [&::-webkit-search-cancel-button]:hidden"
                    placeholder="Search stations or brands…"
                    value={search}
                    onFocus={() => { if (isMobile && sheet !== "full") applySnap("full"); }}
                    onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setSearchResults(null); }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#F8FAFC]"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  aria-label="Search"
                  className="inline-flex items-center justify-center min-h-11 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 flex-shrink-0 transition-all duration-200 cursor-pointer disabled:opacity-60"
                >
                  <Search className="w-4 h-4" strokeWidth={2.4} aria-hidden="true" />
                </button>
              </form>

              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#090B10] border border-white/[0.07]">
                {[
                  { id: "nearest", label: "Nearest", icon: LocateFixed },
                  { id: "cheapest", label: "Cheapest", icon: TrendingDown },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    id={`filter-${f.id}`}
                    onClick={() => setFilter(f.id)}
                    className={`min-h-11 sm:min-h-10 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      filter === f.id
                        ? "bg-orange-500 text-zinc-950"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    <f.icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Station List */}
          <div className="flex-1 overflow-y-auto p-3.5 md:p-4 space-y-2.5 min-h-0 overscroll-contain pb-safe">
            {loadError ? (
              <ErrorBlock
                message={loadError}
                onRetry={() => {
                  const pos = lastFetchRef.current ?? { lat: TAGUIG_CENTER[0], lng: TAGUIG_CENTER[1] };
                  setLoading(true);
                  fetchStations(pos.lat, pos.lng);
                }}
              />
            ) : loading ? (
              <div className="space-y-2.5">
                <LoadingBlock count={4} className="h-32" label="Loading stations…" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="space-y-3">
                <EmptyBlock message={searchResults ? `No stations matched "${search}".` : "No stations found nearby."} />
                {searchResults && (
                  <button type="button" onClick={clearSearch} className="btn-secondary text-sm min-h-11 px-4 mx-auto flex">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              sorted.map((s) => {
                const isSelected = selected === s.station_id;
                const inCompare = compareList.includes(s.station_id);
                return (
                  <div
                    key={s.station_id}
                    id={`station-card-${s.station_id}`}
                    className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? "bg-[#151B2A] border-orange-500/55"
                        : "bg-[#111520] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#141926]"
                    }`}
                    onClick={() => handleCardClick(s)}
                  >
                    <div className="flex justify-between items-start gap-2.5 mb-2.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#F8FAFC] text-sm leading-snug break-words">{s.name}</p>
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

                    {s.fuel_prices?.length > 0 ? (
                      <div className="rounded-xl bg-[#090B10]/70 border border-white/[0.05] px-3 py-1.5 divide-y divide-white/[0.04]">
                        {s.fuel_prices.map((p) => (
                          <PriceTag key={p.price_id} label={p.fuel_type} price={p.price_per_liter} type={p.fuel_type} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No prices listed yet</p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        to={`/dashboard/station/${s.station_id}`}
                        className="flex-1 min-h-11 text-center text-xs sm:text-sm font-medium rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#F8FAFC] px-3 inline-flex items-center justify-center gap-1.5 transition-colors duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Details <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleCompare(s.station_id); }}
                        className={`min-h-11 text-xs sm:text-sm px-3.5 rounded-xl border font-medium transition-all duration-200 inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                          inCompare
                            ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
                            : "bg-white/[0.03] border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06]"
                        }`}
                      >
                        {inCompare
                          ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" /> Added</>
                          : <><Plus className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" /> Compare</>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Map — desktop: fills the right side · mobile: full-screen behind the sheet */}
        <div className="absolute inset-0 isolate md:relative md:inset-auto md:flex-1 md:h-full min-h-0 overflow-hidden">
          <MapContainer
            ref={mapRef}
            center={userLocation ? [userLocation.lat, userLocation.lng] : TAGUIG_CENTER}
            zoom={14}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hasUserPosition && (
              <>
                {Number.isFinite(userLocation.accuracy) && (
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={userLocation.accuracy}
                    interactive={false}
                    pathOptions={{ color: "#3b82f6", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.12 }}
                  />
                )}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={1000}>
                  <Popup>You are here</Popup>
                </Marker>
              </>
            )}
            {sorted.map((s) => (
              <Marker
                key={s.station_id}
                ref={(m) => { if (m) markerRefs.current[s.station_id] = m; else delete markerRefs.current[s.station_id]; }}
                position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                icon={createStationIcon(selected === s.station_id)}
                eventHandlers={{ click: () => setSelected(s.station_id) }}
              >
                <Popup>
                  <div className="min-w-[205px]">
                    {nearest?.station.station_id === s.station_id && (
                      <span className="inline-block rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[11px] font-semibold px-2.5 py-0.5 mb-1.5">
                        Closest to you
                      </span>
                    )}
                    <p className="font-bold text-[#F8FAFC] text-sm mb-0.5">{s.name}</p>
                    <p className="text-xs text-[#94A3B8] mb-2.5">{s.address}</p>
                    {s.fuel_prices?.map((p) => (
                      <div key={p.price_id} className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{p.fuel_type}</span>
                        <span className="font-bold text-orange-400 tabular-nums">{peso(p.price_per_liter)}</span>
                      </div>
                    ))}
                    <Link
                      to={`/dashboard/station/${s.station_id}`}
                      className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 !text-zinc-950 rounded-lg py-2 px-3 transition-colors"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {!(isMobile && sheet === "full") && (
            <button
              type="button"
              id="locate-me-btn"
              onClick={handleLocateMe}
              disabled={!hasUserPosition}
              aria-label="My location"
              title={hasUserPosition ? "My location" : "Waiting for your location…"}
              className="ff-locate-btn absolute right-4 bottom-8 z-[1000] w-11 h-11 rounded-full bg-[#111520]/95 backdrop-blur-md text-cyan-400 shadow-xl
                         border border-white/[0.12] flex items-center justify-center cursor-pointer touch-manipulation
                         hover:bg-[#192030] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LocateFixed className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}

          {stations.length > 0 && (!hasUserPosition || nearest) && (
            <div className="absolute top-3 left-14 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-fit mx-auto z-[1000] pointer-events-none max-w-[calc(100%-4.5rem)] sm:max-w-md bg-[#090B10]/85 backdrop-blur-md text-[#F8FAFC] border border-white/[0.1] text-xs sm:text-sm font-medium rounded-full shadow-xl px-3.5 py-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">
                {nearest
                  ? `Nearest: ${nearest.station.name} (${nearest.distanceKm.toFixed(2)} km)`
                  : "Locating you…"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
