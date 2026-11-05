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

