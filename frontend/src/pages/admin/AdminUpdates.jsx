import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { Spinner } from "../../components/DataStates";
import api from "../../services/api";
import { formatDate, peso } from "../../utils/format";

const FORECAST_FUELS = ["Gasoline", "Diesel", "Kerosene"];
const ADVISORY_FUELS = ["All", "Unleaded 91", "Premium 95", "Diesel", "Kerosene"];
const today = () => new Date().toISOString().slice(0, 10);

const emptyForecast = () => ({ fuel_type: "Gasoline", change_per_liter: "", effective_date: today(), source: "", notes: "" });
const emptyAdvisory = () => ({ title: "", summary: "", source: "DOE", source_url: "", published_date: today(), fuel_type: "All" });

const errText = (ex) => {
  const d = ex.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => `${x.loc?.slice(-1)[0]}: ${(x.msg || "").replace(/^Value error, /, "")}`).join("; ");
  return d || "Request failed";
};

/** Generic create/edit + list for one resource. */
function Manager({ kind, idKey, fields, empty, toBody, renderRow, endpoint }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.get(endpoint).then((r) => setRows(r.data)).catch((ex) => setErr(errText(ex))).finally(() => setLoading(false));
  }, [endpoint]);
  useEffect(load, [load]);

  const reset = () => { setForm(empty()); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setErr(""); setMsg("");
    try {
      if (editingId) await api.put(`${endpoint}/${editingId}`, toBody(form));
      else await api.post(endpoint, toBody(form));
      setMsg(`${kind} ${editingId ? "updated" : "created"}.`);
      reset();
      load();
    } catch (ex) { setErr(errText(ex)); }
    finally { setSaving(false); }
  };

  const edit = (row) => {
    setEditingId(row[idKey]);
    setForm(Object.fromEntries(Object.keys(empty()).map((k) => [k, row[k] ?? ""])));
    setMsg(""); setErr("");
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${kind.toLowerCase()}? This cannot be undone.`)) return;
    setErr(""); setMsg("");
    try { await api.delete(`${endpoint}/${row[idKey]}`); setMsg(`${kind} deleted.`); if (editingId === row[idKey]) reset(); load(); }
    catch (ex) { setErr(errText(ex)); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      <div className="glass-card p-4 md:p-6 self-start">
        <h2 className="text-white font-bold text-lg mb-5">{editingId ? `Edit ${kind}` : `New ${kind}`}</h2>
        {msg && <div role="status" className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm">{msg}</div>}
        {err && <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          {fields(form, setForm)}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 gap-2 disabled:opacity-60">
              {saving && <Spinner />}{editingId ? "Save changes" : `Create ${kind.toLowerCase()}`}
            </button>
            {editingId && <button type="button" onClick={reset} className="btn-secondary px-5">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="glass-card p-4 md:p-6">
        <h2 className="text-white font-bold text-lg mb-5">Published</h2>
        {loading ? <p className="text-slate-400 text-sm flex items-center gap-2"><Spinner /> Loading…</p>
          : rows.length === 0 ? <p className="text-slate-500 text-sm">Nothing here yet.</p>
          : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row[idKey]} className="p-3 rounded-xl bg-dark-600 flex items-start gap-3">
                  <div className="flex-1 min-w-0">{renderRow(row)}</div>
                  <button type="button" onClick={() => edit(row)} aria-label="Edit" className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-500"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => remove(row)} aria-label="Delete" className="p-2.5 rounded-lg text-slate-400 hover:text-danger hover:bg-dark-500"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}

const Field = ({ id, label, children }) => (
  <div><label htmlFor={id} className="label">{label}</label>{children}</div>
);

export default function AdminUpdates() {
  const [tab, setTab] = useState("forecasts");

  return (
    <div className="h-dvh overflow-hidden bg-dark-900 flex flex-col md:flex-row">
      <AdminNav />
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 min-w-0 overscroll-contain">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-black text-white">Updates &amp; Forecasts</h1>
          <p className="text-slate-400 text-sm mt-1">Manage the next-week forecasts and official advisories shown on the user Updates page.</p>
        </div>

        <div role="tablist" aria-label="Content type" className="flex gap-2 mb-6">
          {[["forecasts", "Forecasts"], ["advisories", "Advisories"]].map(([key, label]) => (
            <button key={key} role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} onClick={() => setTab(key)}
              className={`px-5 min-h-[44px] rounded-xl text-sm font-medium transition-all ${tab === key ? "bg-primary text-white" : "bg-dark-600 text-slate-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "forecasts" ? (
          <div role="tabpanel" id="panel-forecasts" aria-labelledby="tab-forecasts">
            <Manager
              kind="Forecast" idKey="forecast_id" endpoint="/api/admin/forecasts" empty={emptyForecast}
              toBody={(f) => ({ fuel_type: f.fuel_type, change_per_liter: Number(f.change_per_liter), effective_date: f.effective_date, source: f.source.trim() || "Fuel Finder", notes: f.notes.trim() || null })}
              fields={(f, set) => (
                <>
                  <Field id="fc-fuel" label="Fuel">
                    <select id="fc-fuel" className="input-field" value={f.fuel_type} onChange={(e) => set({ ...f, fuel_type: e.target.value })}>
                      {FORECAST_FUELS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field id="fc-change" label="Expected change (₱ per liter, negative = decrease)">
                    <input id="fc-change" type="number" step="0.01" min="-100" max="100" required className="input-field" placeholder="e.g. -1.25"
                      value={f.change_per_liter} onChange={(e) => set({ ...f, change_per_liter: e.target.value })} />
                  </Field>
                  <Field id="fc-date" label="Week starting">
                    <input id="fc-date" type="date" required className="input-field" value={f.effective_date} onChange={(e) => set({ ...f, effective_date: e.target.value })} />
                  </Field>
                  <Field id="fc-source" label="Source">
                    <input id="fc-source" className="input-field" maxLength={150} placeholder="e.g. DOE / oil company advisory" value={f.source} onChange={(e) => set({ ...f, source: e.target.value })} />
                  </Field>
                  <Field id="fc-notes" label="Notes (optional)">
                    <textarea id="fc-notes" rows={3} maxLength={1000} className="input-field" value={f.notes} onChange={(e) => set({ ...f, notes: e.target.value })} />
                  </Field>
                </>
              )}
              renderRow={(r) => (
                <>
                  <p className="text-white font-medium text-sm">{r.fuel_type}: <span className={r.direction === "down" ? "text-success" : r.direction === "up" ? "text-danger" : "text-slate-400"}>
                    {r.direction === "down" ? "▼" : r.direction === "up" ? "▲" : "▬"} {peso(Math.abs(r.change_per_liter))}/L</span></p>
                  <p className="text-xs text-slate-500">Week of {formatDate(r.effective_date)} · {r.source}</p>
                </>
              )}
            />
          </div>
        ) : (
          <div role="tabpanel" id="panel-advisories" aria-labelledby="tab-advisories">
            <Manager
              kind="Advisory" idKey="advisory_id" endpoint="/api/admin/advisories" empty={emptyAdvisory}
              toBody={(f) => ({ title: f.title.trim(), summary: f.summary.trim(), source: f.source.trim(), source_url: f.source_url.trim() || null, published_date: f.published_date, fuel_type: f.fuel_type })}
              fields={(f, set) => (
                <>
                  <Field id="ad-title" label="Title">
                    <input id="ad-title" required minLength={3} maxLength={200} className="input-field" value={f.title} onChange={(e) => set({ ...f, title: e.target.value })} />
                  </Field>
                  <Field id="ad-summary" label="Summary">
                    <textarea id="ad-summary" required minLength={3} maxLength={2000} rows={4} className="input-field" value={f.summary} onChange={(e) => set({ ...f, summary: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="ad-source" label="Source">
                      <input id="ad-source" required maxLength={100} className="input-field" value={f.source} onChange={(e) => set({ ...f, source: e.target.value })} />
                    </Field>
                    <Field id="ad-date" label="Date published">
                      <input id="ad-date" type="date" required className="input-field" value={f.published_date} onChange={(e) => set({ ...f, published_date: e.target.value })} />
                    </Field>
                  </div>
                  <Field id="ad-fuel" label="Applies to">
                    <select id="ad-fuel" className="input-field" value={f.fuel_type} onChange={(e) => set({ ...f, fuel_type: e.target.value })}>
                      {ADVISORY_FUELS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field id="ad-url" label="Link (optional)">
                    <input id="ad-url" type="url" maxLength={500} placeholder="https://…" className="input-field" value={f.source_url} onChange={(e) => set({ ...f, source_url: e.target.value })} />
                  </Field>
                </>
              )}
              renderRow={(r) => (
                <>
                  <p className="text-white font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(r.published_date)} · {r.source} · {r.fuel_type}</p>
                </>
              )}
            />
          </div>
        )}
      </main>
    </div>
  );
}

