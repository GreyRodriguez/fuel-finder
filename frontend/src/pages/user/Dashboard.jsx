import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TAGUIG_CENTER = [14.5243, 121.0792];

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
  const [stations, setStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("nearest");
  const [selected, setSelected] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [searchResults, setSearchResults] = useState(null);

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

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-dark-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex-shrink-0 bg-dark-800 border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="text-xl font-black text-white">
          Fuel<span className="text-primary">Finder</span>
        </Link>
        <div className="flex items-center gap-3">
          {compareList.length > 0 && (
            <button
              onClick={() => navigate(`/dashboard/compare?ids=${compareList.join(",")}`)}
              className="btn-primary text-sm px-4 py-2"
            >
              Compare ({compareList.length})
            </button>
          )}
          <Link to="/dashboard/profile" className="btn-secondary text-sm px-4 py-2">
            {user?.full_name?.split(" ")[0]}
          </Link>
          <button onClick={() => { logout(); navigate("/"); }} className="text-slate-400 hover:text-white text-sm transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-96 flex-shrink-0 bg-dark-800 border-r border-white/10 flex flex-col overflow-hidden min-h-0 h-full">
          {/* Search & Filters */}
          <div className="flex-shrink-0 p-4 border-b border-white/10 space-y-3 bg-dark-800 z-10">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                id="station-search"
                className="input-field text-sm py-2"
                placeholder="Search stations…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setSearchResults(null); }}
              />
              <button type="submit" className="btn-primary px-3 py-2 text-sm">🔍</button>
            </form>
            <div className="flex gap-2">
              {["nearest", "cheapest"].map((f) => (
                <button
                  key={f}
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
                onClick={() => setSelected(s.station_id === selected ? null : s.station_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.brand} · {s.barangay}</p>
                  </div>
                  {s.distance_km != null && (
                    <span className="text-xs text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-full">
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
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
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
        </div>

        {/* Map - Sticky & fills center dashboard */}
        <div className="flex-1 relative h-full min-h-0 sticky top-0 overflow-hidden">
          <MapContainer
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
