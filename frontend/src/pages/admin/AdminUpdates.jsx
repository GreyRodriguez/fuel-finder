import { useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, TrendingUp, Megaphone } from "lucide-react";
import AdminLayout, { AdminToast } from "../../components/AdminLayout";
import AdminSheet from "../../components/AdminSheet";
import { LoadingBlock, ErrorBlock, EmptyBlock, Spinner } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import useToast from "../../hooks/useToast";
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

const Field = ({ id, label, children }) => (
  <div>
    <label htmlFor={id} className="label">{label}</label>
    {children}
  </div>
);

function SheetForm({ kind, idKey, endpoint, empty, initialRow, fields, toBody, onClose, onSaved }) {
  const editingId = initialRow?.[idKey] ?? null;
  const [form, setForm] = useState(() =>
    initialRow ? Object.fromEntries(Object.keys(empty()).map((k) => [k, initialRow[k] ?? ""])) : empty(),
  );
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormErr("");
    try {
      if (editingId) await api.put(`${endpoint}/${editingId}`, toBody(form));
      else await api.post(endpoint, toBody(form));
      onSaved(`${kind} ${editingId ? "updated" : "created"}.`);
    } catch (ex) {
      setFormErr(errText(ex));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {formErr && (
        <div role="alert" className="bg-danger/10 border border-danger/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
          {formErr}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        {fields(form, setForm)}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary min-h-[48px] sm:min-h-[44px] sm:px-6">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 min-h-[48px] sm:min-h-[44px] gap-2 disabled:opacity-60">
            {saving && <Spinner />}{editingId ? "Save Changes" : `Publish ${kind}`}
          </button>
        </div>
      </form>
    </>
  );
}

/** Published list + delete actions for Forecasts or Advisories. */
function ManagerList({ kind, idKey, endpoint, renderRow, refreshTick, onEdit, onNotify }) {
  const { data, loading, error, reload, mutate } = useApiData(endpoint, { _r: refreshTick });
  const [busyId, setBusyId] = useState(null);
  const rows = data ?? [];

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${kind.toLowerCase()}? This cannot be undone.`)) return;
    const id = row[idKey];
    setBusyId(id);
    try {
      await api.delete(`${endpoint}/${id}`);
      mutate((list) => (list ?? []).filter((r) => r[idKey] !== id));
      onNotify(`${kind} deleted.`);
    } catch (ex) {
      onNotify(errText(ex), "error");
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorBlock message={error} onRetry={reload} />;

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <LoadingBlock count={4} className="h-32" label={`Loading ${kind.toLowerCase()}s…`} />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyBlock message={`No ${kind.toLowerCase()}s published yet. Tap New ${kind} above to add one.`} />;
  }

  return (
    <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
      {rows.map((row) => {
        const busy = busyId === row[idKey];
        return (
          <li key={row[idKey]} className="glass-card p-4 md:p-5 flex items-start justify-between gap-3 min-w-0">
            <div className="flex-1 min-w-0">{renderRow(row)}</div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(row)}
                aria-label={`Edit ${kind.toLowerCase()}`}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-dark-600 transition-colors"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(row)}
                aria-label={`Delete ${kind.toLowerCase()}`}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
              >
                {busy ? <Spinner className="w-4 h-4" /> : <Trash2 className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const CONFIG = {
  forecasts: {
    kind: "Forecast",
    idKey: "forecast_id",
    endpoint: "/api/admin/forecasts",
    empty: emptyForecast,
    toBody: (f) => ({
      fuel_type: f.fuel_type,
      change_per_liter: Number(f.change_per_liter),
      effective_date: f.effective_date,
      source: f.source.trim() || "Fuel Finder",
      notes: f.notes.trim() || null,
    }),
    fields: (f, set) => (
      <>
        <Field id="fc-fuel" label="Fuel">
          <select id="fc-fuel" className="input-field min-h-[44px]" value={f.fuel_type} onChange={(e) => set({ ...f, fuel_type: e.target.value })}>
            {FORECAST_FUELS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field id="fc-change" label="Expected change (₱ per liter, negative = decrease)">
          <input id="fc-change" type="number" inputMode="decimal" step="0.01" min="-100" max="100" required className="input-field min-h-[44px]" placeholder="e.g. -1.25"
            value={f.change_per_liter} onChange={(e) => set({ ...f, change_per_liter: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="fc-date" label="Week starting">
            <input id="fc-date" type="date" required className="input-field min-h-[44px]" value={f.effective_date} onChange={(e) => set({ ...f, effective_date: e.target.value })} />
          </Field>
          <Field id="fc-source" label="Source">
            <input id="fc-source" className="input-field min-h-[44px]" maxLength={150} placeholder="e.g. DOE advisory" value={f.source} onChange={(e) => set({ ...f, source: e.target.value })} />
          </Field>
        </div>
        <Field id="fc-notes" label="Notes (optional)">
          <textarea id="fc-notes" rows={3} maxLength={1000} className="input-field" value={f.notes} onChange={(e) => set({ ...f, notes: e.target.value })} />
        </Field>
      </>
    ),
    renderRow: (r) => {
      const tone = r.direction === "down"
        ? "bg-success/10 text-success border-success/25"
        : r.direction === "up"
          ? "bg-danger/10 text-danger border-danger/25"
          : "bg-slate-500/10 text-slate-300 border-white/10";
      const arrow = r.direction === "down" ? "▼" : r.direction === "up" ? "▲" : "▬";
      return (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white font-bold text-sm">{r.fuel_type}</span>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-bold tabular-nums ${tone}`}>
              {arrow} {peso(Math.abs(r.change_per_liter))}/L
            </span>
          </div>
          <p className="text-xs text-slate-400">Week of {formatDate(r.effective_date)} · {r.source}</p>
          {r.notes && <p className="text-xs text-slate-500 line-clamp-2">{r.notes}</p>}
        </div>
      );
    },
  },
  advisories: {
    kind: "Advisory",
    idKey: "advisory_id",
    endpoint: "/api/admin/advisories",
    empty: emptyAdvisory,
    toBody: (f) => ({
      title: f.title.trim(),
      summary: f.summary.trim(),
      source: f.source.trim(),
      source_url: f.source_url.trim() || null,
      published_date: f.published_date,
      fuel_type: f.fuel_type,
    }),
    fields: (f, set) => (
      <>
        <Field id="ad-title" label="Title">
          <input id="ad-title" required minLength={3} maxLength={200} className="input-field min-h-[44px]" value={f.title} onChange={(e) => set({ ...f, title: e.target.value })} />
        </Field>
        <Field id="ad-summary" label="Summary">
          <textarea id="ad-summary" required minLength={3} maxLength={2000} rows={4} className="input-field" value={f.summary} onChange={(e) => set({ ...f, summary: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="ad-source" label="Source">
            <input id="ad-source" required maxLength={100} className="input-field min-h-[44px]" value={f.source} onChange={(e) => set({ ...f, source: e.target.value })} />
          </Field>
          <Field id="ad-date" label="Date published">
            <input id="ad-date" type="date" required className="input-field min-h-[44px]" value={f.published_date} onChange={(e) => set({ ...f, published_date: e.target.value })} />
          </Field>
        </div>
        <Field id="ad-fuel" label="Applies to">
          <select id="ad-fuel" className="input-field min-h-[44px]" value={f.fuel_type} onChange={(e) => set({ ...f, fuel_type: e.target.value })}>
            {ADVISORY_FUELS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field id="ad-url" label="Link (optional)">
          <input id="ad-url" type="url" maxLength={500} placeholder="https://…" className="input-field min-h-[44px]" value={f.source_url} onChange={(e) => set({ ...f, source_url: e.target.value })} />
        </Field>
      </>
    ),
    renderRow: (r) => (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[11px] font-semibold">
            {r.fuel_type}
          </span>
          <span className="text-xs text-slate-500">{formatDate(r.published_date)} · {r.source}</span>
        </div>
        <p className="text-white font-semibold text-sm leading-snug">{r.title}</p>
        {r.summary && <p className="text-xs text-slate-400 line-clamp-2">{r.summary}</p>}
        {r.source_url && (
          <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-primary-light inline-flex items-center gap-1 pt-0.5">
            Source link <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        )}
      </div>
    ),
  },
};

export default function AdminUpdates() {
  const [tab, setTab] = useState("forecasts");
  const [sheet, setSheet] = useState(null); // null | { tab, row }
  const [refreshTick, setRefreshTick] = useState(0);
  const { toast, show } = useToast();

  const cfg = CONFIG[tab];
  const sheetCfg = sheet ? CONFIG[sheet.tab] : null;

  return (
    <AdminLayout
      title="Updates & Forecasts"
      subtitle="Manage next-week forecasts and official advisories shown to drivers."
      actions={
        <button
          type="button"
          onClick={() => setSheet({ tab, row: null })}
          className="btn-primary text-sm min-h-[44px] px-4 gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> New {cfg.kind}
        </button>
      }
    >
      {/* Full-width segmented tabs on mobile */}
      <div
        role="tablist"
        aria-label="Content type"
        className="grid grid-cols-2 sm:inline-grid sm:w-auto gap-1 p-1 mb-5 md:mb-6 rounded-xl bg-dark-800 border border-white/10"
      >
        {[
          { key: "forecasts", label: "Forecasts", icon: TrendingUp },
          { key: "advisories", label: "Advisories", icon: Megaphone },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              onClick={() => { setTab(t.key); setSheet(null); }}
              className={`min-h-[44px] px-4 sm:px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-white hover:bg-dark-700"
              }`}
            >
              <t.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        <ManagerList
          key={tab}
          kind={cfg.kind}
          idKey={cfg.idKey}
          endpoint={cfg.endpoint}
          renderRow={cfg.renderRow}
          refreshTick={refreshTick}
          onEdit={(row) => setSheet({ tab, row })}
          onNotify={show}
        />
      </div>

      <AdminSheet
        open={Boolean(sheet)}
        onClose={() => setSheet(null)}
        title={sheetCfg ? (sheet.row ? `Edit ${sheetCfg.kind}` : `New ${sheetCfg.kind}`) : ""}
        subtitle="Shown on the user Updates page"
      >
        {sheet && sheetCfg && (
          <SheetForm
            key={`${sheet.tab}-${sheet.row?.[sheetCfg.idKey] ?? "new"}`}
            kind={sheetCfg.kind}
            idKey={sheetCfg.idKey}
            endpoint={sheetCfg.endpoint}
            empty={sheetCfg.empty}
            initialRow={sheet.row}
            fields={sheetCfg.fields}
            toBody={sheetCfg.toBody}
            onClose={() => setSheet(null)}
            onSaved={(msg) => {
              setSheet(null);
              show(msg);
              setRefreshTick((t) => t + 1);
            }}
          />
        )}
      </AdminSheet>

      <AdminToast message={toast.message} tone={toast.tone} />
    </AdminLayout>
  );
}
