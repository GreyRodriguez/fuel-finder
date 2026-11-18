import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Fuel, Check, ArrowRight } from "lucide-react";
import api from "../../services/api";
import AdminLayout, { AdminToast } from "../../components/AdminLayout";
import StationCombobox from "../../components/StationCombobox";
import { LoadingBlock, ErrorBlock, Spinner } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import useToast from "../../hooks/useToast";
import { FUEL_OPTIONS, formatDate, peso } from "../../utils/format";

const FUEL_STYLE = {
  "Unleaded 91": { ring: "border-primary bg-primary/15 text-white", dot: "bg-primary" },
  "Premium 95": { ring: "border-purple-400 bg-purple-500/15 text-white", dot: "bg-purple-400" },
  Diesel: { ring: "border-accent bg-accent/15 text-white", dot: "bg-accent" },
};

export default function Prices() {
  const [params] = useSearchParams();
  const initialFuel = FUEL_OPTIONS.includes(params.get("fuel_type") || "") ? params.get("fuel_type") : FUEL_OPTIONS[0];
  const rawStation = Number.parseInt(params.get("station_id") || "", 10);
  const initialStation = Number.isNaN(rawStation) ? "" : rawStation;
  const initialPrice = params.get("price") || "";

  const { data, loading, error, reload } = useApiData("/api/admin/stations");
  const { toast, show } = useToast();
  const priceInputRef = useRef(null);

  const [form, setForm] = useState({
    station_id: initialStation,
    fuel_type: initialFuel,
    price_per_liter: initialPrice,
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const activeStations = (data ?? []).filter((s) => s.status === "active");
  const selectedStation = activeStations.find((s) => String(s.station_id) === String(form.station_id));
  const currentFuelRecord = selectedStation?.fuel_prices?.find(
    (fp) => fp.fuel_type === form.fuel_type && fp.status === "active",
  );
  const currentVal = currentFuelRecord ? Number(currentFuelRecord.price_per_liter) : null;
  const enteredVal = form.price_per_liter !== "" ? Number(form.price_per_liter) : null;
  const delta = currentVal != null && enteredVal != null && !Number.isNaN(enteredVal) ? enteredVal - currentVal : null;

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormErr("");
    if (!form.station_id) {
      setFormErr("Please choose a gas station first.");
      return;
    }
    const priceNum = Number.parseFloat(form.price_per_liter);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setFormErr("Enter a valid price per liter greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/admin/prices", {
        station_id: Number.parseInt(form.station_id, 10),
        fuel_type: form.fuel_type,
        price_per_liter: priceNum,
      });
      show(`${form.fuel_type} price updated to ${peso(priceNum)}.`);
      setForm((f) => ({ ...f, price_per_liter: "" }));
      reload();
    } catch (ex) {
      setFormErr(ex.response?.data?.detail || "Error saving price.");
    } finally {
      setSaving(false);
    }
  };

  const quickSelectFuel = (ft, currentPrice) => {
    setForm((f) => ({
      ...f,
      fuel_type: ft,
      price_per_liter: currentPrice != null ? String(Number(currentPrice).toFixed(2)) : f.price_per_liter,
    }));
    priceInputRef.current?.focus();
  };

  return (
    <AdminLayout
      title="Fuel Price Management"
      subtitle="Search a station, pick a fuel grade and log the current pump price."
    >
      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <LoadingBlock count={2} className="h-72" label="Loading stations…" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
          {/* Form */}
          <section className="glass-card p-4 md:p-6">
            <h2 className="text-white font-bold text-lg mb-4">Add / Update Price</h2>

            {formErr && (
              <div role="alert" className="bg-danger/10 border border-danger/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
                {formErr}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="price-station" className="label">Station</label>
                <StationCombobox
                  id="price-station"
                  stations={activeStations}
                  value={form.station_id}
                  onChange={(id) => { setForm((f) => ({ ...f, station_id: id })); setFormErr(""); }}
                />
              </div>

              <div>
                <span className="label">Fuel Type</span>
                <div role="radiogroup" aria-label="Fuel type" className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-dark-800 border border-white/10">
                  {FUEL_OPTIONS.map((ft) => {
                    const active = form.fuel_type === ft;
                    const style = FUEL_STYLE[ft] || FUEL_STYLE["Unleaded 91"];
                    return (
                      <button
                        key={ft}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setForm((f) => ({ ...f, fuel_type: ft }))}
                        className={`h-10 px-2 rounded-lg border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                          active
                            ? style.ring
                            : "border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden="true" />
                        <span className="truncate">{ft}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label htmlFor="price-value" className="label mb-0">Price per Liter (₱)</label>
                  {delta != null && Math.abs(delta) >= 0.01 && (
                    <span className={`text-xs font-semibold ${delta > 0 ? "text-danger" : "text-success"}`}>
                      {delta > 0 ? "+" : "−"}{peso(Math.abs(delta)).slice(1)} vs current
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none" aria-hidden="true">
                    ₱
                  </span>
                  <input
                    ref={priceInputRef}
                    id="price-value"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    max="999.99"
                    className="input-field min-h-[48px] pl-8 text-lg font-bold"
                    placeholder="e.g. 62.50"
                    value={form.price_per_liter}
                    onChange={(e) => { setForm({ ...form, price_per_liter: e.target.value }); setFormErr(""); }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full sm:w-auto h-10 px-6 text-sm gap-2 disabled:opacity-60"
              >
                {saving ? <><Spinner /> Saving…</> : <><Check className="w-4 h-4" aria-hidden="true" /> Save Price</>}
              </button>
            </form>
          </section>

          {/* Current prices for selected station */}
          <section className="glass-card p-4 md:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-white font-bold text-lg truncate">
                  {selectedStation ? selectedStation.name : "Current Station Prices"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedStation
                    ? `${selectedStation.brand || "Unbranded"}${selectedStation.barangay ? ` · ${selectedStation.barangay}` : ""} · Tap a fuel to edit`
                    : "Choose an active station to view and tap-edit its prices."}
                </p>
              </div>
            </div>

            {selectedStation ? (
              <div className="space-y-3">
                {FUEL_OPTIONS.map((ft) => {
                  const p = selectedStation.fuel_prices?.find((fp) => fp.fuel_type === ft && fp.status === "active");
                  const isSelected = form.fuel_type === ft;
                  const style = FUEL_STYLE[ft] || FUEL_STYLE["Unleaded 91"];
                  return (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => quickSelectFuel(ft, p?.price_per_liter)}
                      className={`w-full text-left flex items-center justify-between gap-3 p-4 rounded-xl border transition-all min-h-[68px] ${
                        isSelected
                          ? "bg-dark-600 border-primary/50"
                          : "bg-dark-800/90 border-white/5 hover:border-white/20 hover:bg-dark-600/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden="true" />
                          {ft}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {p ? `Updated ${formatDate(p.date_updated)} · ${p.time_updated?.slice(0, 5)}` : "Not set yet — tap to add"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className={`text-xl font-black tabular-nums ${p ? "text-primary" : "text-slate-600"}`}>
                          {p ? peso(p.price_per_liter) : "—"}
                        </p>
                        <ArrowRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                <Fuel className="w-6 h-6 text-slate-600" aria-hidden="true" />
                <p>No station selected</p>
              </div>
            )}
          </section>
        </div>
      )}

      <AdminToast message={toast.message} tone={toast.tone} />
    </AdminLayout>
  );
}
