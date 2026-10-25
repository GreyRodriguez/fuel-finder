import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminNav from "../../components/AdminNav";

const FUEL_TYPES = ["Gasoline", "Diesel", "Premium Gasoline"];

export default function Prices() {
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState({ station_id: "", fuel_type: "Gasoline", price_per_liter: "" });
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");

  useEffect(() => { api.get("/api/admin/stations").then((r) => setStations(r.data)); }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      await api.post("/api/admin/prices", { ...form, station_id: parseInt(form.station_id), price_per_liter: parseFloat(form.price_per_liter) });
      setMsg(`Price for ${form.fuel_type} updated successfully!`);
      setForm({ ...form, price_per_liter: "" });
    } catch (ex) { setErr(ex.response?.data?.detail || "Error saving price"); }
  };

  const selectedStation = stations.find((s) => s.station_id === parseInt(form.station_id));

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-dark-900 flex">
      <AdminNav />
      <main className="flex-1 h-screen overflow-y-auto p-8 min-w-0 overscroll-contain">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Fuel Price Management</h1>
        </div>
        {msg && <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm">{msg}</div>}
        {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{err}</div>}

        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <div className="glass-card p-6">
            <h2 className="text-white font-bold text-lg mb-5">Add / Update Price</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Select Station</label>
                <select id="price-station" className="input-field" value={form.station_id} onChange={(e) => setForm({ ...form, station_id: e.target.value })} required>
                  <option value="">— Choose a station —</option>
                  {stations.filter(s => s.status === "active").map((s) => (
                    <option key={s.station_id} value={s.station_id}>{s.name} ({s.brand})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fuel Type</label>
                <select id="price-fuel-type" className="input-field" value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}>
                  {FUEL_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Price per Liter (₱)</label>
                <input id="price-value" type="number" step="0.01" min="0" className="input-field" placeholder="e.g. 62.50"
                  value={form.price_per_liter} onChange={(e) => setForm({ ...form, price_per_liter: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary w-full py-3">Save Price</button>
            </form>
          </div>

          {/* Current prices for selected station */}
          <div className="glass-card p-6">
            <h2 className="text-white font-bold text-lg mb-5">
              {selectedStation ? `${selectedStation.name} — Current Prices` : "Select a station to view prices"}
            </h2>
            {selectedStation ? (
              <div className="space-y-3">
                {selectedStation.fuel_prices?.length === 0 && <p className="text-slate-500 text-sm">No prices yet.</p>}
                {FUEL_TYPES.map((ft) => {
                  const p = selectedStation.fuel_prices?.find((fp) => fp.fuel_type === ft && fp.status === "active");
                  return (
                    <div key={ft} className="flex justify-between items-center p-4 rounded-xl bg-dark-600">
                      <div>
                        <p className="text-white font-medium">{ft}</p>
                        {p && <p className="text-xs text-slate-500">Updated: {p.date_updated}</p>}
                      </div>
                      <p className={`text-xl font-black ${p ? "text-primary" : "text-slate-600"}`}>
                        {p ? `₱${Number(p.price_per_liter).toFixed(2)}` : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                No station selected
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
