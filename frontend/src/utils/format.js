/** Fuel names as shown in the UI. */
export const FUEL_OPTIONS = ["Unleaded 91", "Premium 95", "Diesel"];

export const peso = (n) => (n == null || Number.isNaN(Number(n)) ? "—" : `₱${Number(n).toFixed(2)}`);

/** "2026-11-05" → "Nov 5, 2026" (parsed as a local date so there is no timezone shift). */
export function formatDate(iso, opts = { month: "short", day: "numeric", year: "numeric" }) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", opts);
}

/** Direction → colour classes: price going down is good (green), up is bad (red). */
export const DIRECTION_STYLE = {
  down: { text: "text-success", bg: "bg-success/10", border: "border-success/30", stroke: "#22c55e", arrow: "▼" },
  up: { text: "text-danger", bg: "bg-danger/10", border: "border-danger/30", stroke: "#ef4444", arrow: "▲" },
  flat: { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-white/10", stroke: "#94a3b8", arrow: "▬" },
};

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Distance in km (rounded to 2 decimals) from `{ lat, lng }` to a station, or null if unavailable. */
export function distanceToStation(coords, station) {
  if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return null;
  const lat = Number.parseFloat(station?.latitude);
  const lng = Number.parseFloat(station?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return Number(haversineKm(coords.lat, coords.lng, lat, lng).toFixed(2));
}

