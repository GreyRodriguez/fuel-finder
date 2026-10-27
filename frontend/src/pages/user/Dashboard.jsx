import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../context/AuthContext";
import useMediaQuery, { MOBILE_QUERY } from "../../hooks/useMediaQuery";
import api from "../../services/api";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TAGUIG_CENTER = [14.5243, 121.0792];

// Mobile bottom-sheet snap points, smallest → largest
const SNAP_ORDER = ["peek", "half", "full"];
const SHEET_TOP_GAP = 12; // px of map left visible above a fully-open sheet

/** CSS height for a snap state. "peek" = just the sheet header (handle + search). */
const snapToCss = (state, headerEl) => {
  if (state === "peek") return `${headerEl?.offsetHeight ?? 170}px`;
  if (state === "half") return "50%";
  return `calc(100% - ${SHEET_TOP_GAP}px)`;
};

const createStationIcon = (isSelected) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:34px;height:34px;background:${isSelected ? "#f97316" : "#1a1a2e"};
      border:2.5px solid ${isSelected ? "#fed7aa" : "#f97316"};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      box-shadow:0 4px 12px rgba(249,115,22,0.4);
      display:flex;align-items:center;justify-content:center;
    "></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });

function PriceTag({ label, price, type }) {
  const isGas = type === "Gasoline" || type === "Unleaded 91" || type === "U91";
  const isDiesel = type === "Diesel" || type === "DIESEL";
  const color = isGas ? "text-primary" : isDiesel ? "text-accent" : "text-purple-400";
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-sm font-bold ${color}`}>₱{Number(price).toFixed(2)}/L</span>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [stations, setStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("nearest");
  const [selected, setSelected] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [sheet, setSheet] = useState("half");

  const wrapRef = useRef(null);        // holds the --sheet-h CSS variable
  const sheetHeaderRef = useRef(null); // measured for the "peek" height
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const dragRef = useRef(null);

  const fetchStations = useCallback(async (lat, lng) => {
    try {
      const res = await api.get(`/api/stations/?lat=${lat}&lng=${lng}&radius=15`);
      setStations(res.data);
    } catch {
      console.error("Failed to load stations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        fetchStations(loc.lat, loc.lng);
      },
      () => fetchStations(TAGUIG_CENTER[0], TAGUIG_CENTER[1])
    );
  }, [fetchStations]);

  // ── Bottom sheet (mobile only; CSS ignores --sheet-h at ≥768px) ──────────
  const applySnap = useCallback((state) => {
    // Write the variable directly too, so snapping back to the *same* state after a drag still resets the height.
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
    const velocity = e.timeStamp - d.lastT > 120 ? 0 : d.v; // finger paused → no flick
    let target;
    if (Math.abs(velocity) > 0.4) {
      // Flick: finger moving up (negative v) grows the sheet, down shrinks it
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
    const res = await api.get(`/api/stations/search?q=${encodeURIComponent(search)}`);
    setSearchResults(res.data);
  };

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

  const countLabel = loading
    ? "Loading stations…"
    : `${sorted.length} station${sorted.length !== 1 ? "s" : ""} ${searchResults ? "found" : "nearby"}`;

  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="h-dvh overflow-hidden bg-dark-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex-shrink-0 bg-dark-800 border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-50">
        <Link to="/" className="text-lg md:text-xl font-black text-white flex-shrink-0">
          Fuel<span className="text-primary">Finder</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {compareList.length > 0 && (
            <button
              id="compare-btn"
              onClick={() => navigate(`/dashboard/compare?ids=${compareList.join(",")}`)}
              className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
            >
              Compare ({compareList.length})
            </button>
          )}
          {/* Mobile: avatar initial. Desktop: name button (wrapped — .btn-secondary forces display). */}
          <Link
            to="/dashboard/profile"
            id="profile-avatar"
            aria-label="My profile"
            className="md:hidden w-9 h-9 flex-shrink-0 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-sm font-bold text-white"
          >
            {firstName?.[0]?.toUpperCase() || "U"}
          </Link>
          <div className="hidden md:block">
            <Link to="/dashboard/profile" className="btn-secondary text-sm px-4 py-2">
              {firstName}
            </Link>
          </div>
          <button
            id="logout-btn"
            onClick={() => { logout(); navigate("/"); }}
            aria-label="Logout"
            className="text-slate-400 hover:text-white text-sm transition-colors p-2 -mr-2 md:p-0 md:mr-0"
          >
            <svg className="w-5 h-5 md:hidden" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </nav>

      <div ref={wrapRef} className="ff-sheet-wrap relative flex flex-1 overflow-hidden min-h-0">
        {/* Station list — desktop: left sidebar · mobile: draggable bottom sheet over the map */}
        <aside
          aria-label="Stations"
          className="ff-sheet absolute inset-x-0 bottom-0 z-20 rounded-t-3xl border-t shadow-[0_-12px_40px_rgba(0,0,0,0.55)]
                     md:relative md:inset-auto md:z-auto md:w-96 md:h-full md:rounded-none md:border-t-0 md:border-r md:shadow-none
                     flex-shrink-0 bg-dark-800 border-white/10 flex flex-col overflow-hidden min-h-0"
        >
          {/* Sheet header: drag handle (mobile) + Search & Filters */}
          <div ref={sheetHeaderRef} className="flex-shrink-0 border-b border-white/10 bg-dark-800 z-10">
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
              className="md:hidden touch-none select-none cursor-grab active:cursor-grabbing pt-2.5 pb-1 px-4 flex flex-col items-center gap-1.5"
            >
              <span className="block w-10 h-1.5 rounded-full bg-white/25" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-400">{countLabel}</span>
            </div>
            <div className="p-4 pt-2 md:pt-4 space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  id="station-search"
                  type="search"
                  enterKeyHint="search"
                  className="input-field text-sm py-2"
                  placeholder="Search stations…"
                  value={search}
                  onFocus={() => { if (isMobile && sheet !== "full") applySnap("full"); }}
                  onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setSearchResults(null); }}
                />
                <button type="submit" aria-label="Search" className="btn-primary px-3 py-2 text-sm">🔍</button>
              </form>
              <div className="flex gap-2">
                {["nearest", "cheapest"].map((f) => (
                  <button
                    key={f}
                    id={`filter-${f}`}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                      filter === f ? "bg-primary text-white" : "bg-dark-600 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f === "nearest" ? "📍 Nearest" : "💸 Cheapest"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Station List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 overscroll-contain">
            {loading && <p className="text-slate-400 text-center py-8">Loading stations…</p>}
            {!loading && sorted.length === 0 && (
              <p className="text-slate-500 text-center py-8">No stations found.</p>
            )}
            {sorted.map((s) => (
              <div
                key={s.station_id}
                id={`station-card-${s.station_id}`}
                className={`glass-card p-4 cursor-pointer transition-all hover:border-primary/50 ${
                  selected === s.station_id ? "border-primary/70 shadow-lg shadow-primary/10" : ""
                }`}
                onClick={() => handleCardClick(s)}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.brand} · {s.barangay}</p>
                  </div>
                  {s.distance_km != null && (
                    <span className="flex-shrink-0 text-xs text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-full">
                      {s.distance_km} km
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {s.fuel_prices?.map((p) => (
                    <PriceTag key={p.price_id} label={p.fuel_type} price={p.price_per_liter} type={p.fuel_type} />
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/dashboard/station/${s.station_id}`}
                    className="flex-1 text-center text-xs btn-secondary py-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Details
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCompare(s.station_id); }}
                    className={`text-xs px-3 py-2.5 md:py-1.5 rounded-xl border transition-all ${
                      compareList.includes(s.station_id)
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-dark-600 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {compareList.includes(s.station_id) ? "✓ Added" : "+ Compare"}
                  </button>
                </div>
              </div>
            ))}
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
            {sorted.map((s) => (
              <Marker
                key={s.station_id}
                ref={(m) => { if (m) markerRefs.current[s.station_id] = m; else delete markerRefs.current[s.station_id]; }}
                position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                icon={createStationIcon(selected === s.station_id)}
                eventHandlers={{ click: () => setSelected(s.station_id) }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-bold text-white text-sm mb-1">{s.name}</p>
                    <p className="text-xs text-slate-400 mb-2">{s.address}</p>
                    {s.fuel_prices?.map((p) => (
                      <div key={p.price_id} className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{p.fuel_type}</span>
                        <span className="font-bold text-primary">₱{Number(p.price_per_liter).toFixed(2)}</span>
                      </div>
                    ))}
                    <Link
                      to={`/dashboard/station/${s.station_id}`}
                      className="block mt-2 text-center text-xs bg-primary text-white rounded-lg py-1.5"
                    >
                      View Details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
