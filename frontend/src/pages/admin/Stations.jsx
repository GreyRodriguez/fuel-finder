import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Plus, Pencil, Trash2, MapPin, Phone, ExternalLink, X, Banknote,
} from "lucide-react";
import api from "../../services/api";
import AdminLayout, { AdminToast } from "../../components/AdminLayout";
import AdminSheet from "../../components/AdminSheet";
import { LoadingBlock, ErrorBlock, EmptyBlock, Spinner } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import useToast from "../../hooks/useToast";
import { peso } from "../../utils/format";

const EMPTY = {
  name: "",
  brand: "",
  address: "",
  barangay: "",
  city: "Taguig City",
  latitude: "",
  longitude: "",
  contact_info: "",
  status: "active",
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

export default function Stations() {
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload, mutate } = useApiData("/api/admin/stations");
  const { toast, show } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(() => params.get("new") === "1");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const stations = data ?? [];
  const activeCount = stations.filter((s) => s.status === "active").length;
  const inactiveCount = stations.length - activeCount;

  const q = search.trim().toLowerCase();
  const visible = stations.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (!q) return true;
    return [s.name, s.brand, s.address, s.barangay].some((v) => v?.toLowerCase().includes(q));
  });

  const openCreate = () => {
    setForm(EMPTY);
    setEditing(null);
    setFormErr("");
    setSheetOpen(true);
    if (params.get("new")) setParams({}, { replace: true });
  };

  const openEdit = (s) => {
    setForm({
      name: s.name || "",
      brand: s.brand || "",
      address: s.address || "",
      barangay: s.barangay || "",
      city: s.city || "Taguig City",
      latitude: s.latitude ?? "",
      longitude: s.longitude ?? "",
      contact_info: s.contact_info || "",
      status: s.status || "active",
    });
    setEditing(s.station_id);
    setFormErr("");
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setFormErr("");
    if (params.get("new")) setParams({}, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormErr("");
    try {
      if (editing) {
        await api.put(`/api/admin/stations/${editing}`, form);
        show("Station updated.");
      } else {
        await api.post("/api/admin/stations", form);
        show("Station created.");
      }
      setSheetOpen(false);
      setForm(EMPTY);
      setEditing(null);
      reload();
    } catch (ex) {
      setFormErr(ex.response?.data?.detail || "Couldn't save station. Check all fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"? This also deletes its fuel prices.`)) return;
    setBusyId(s.station_id);
    try {
      await api.delete(`/api/admin/stations/${s.station_id}`);
      mutate((list) => (list ?? []).filter((x) => x.station_id !== s.station_id));
      show(`Deleted ${s.name}.`);
    } catch (ex) {
      show(ex.response?.data?.detail || "Couldn't delete station.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const countFor = (id) => (id === "all" ? stations.length : id === "active" ? activeCount : inactiveCount);
  const hasCoords =
    form.latitude !== "" && form.longitude !== "" &&
    !Number.isNaN(Number(form.latitude)) && !Number.isNaN(Number(form.longitude));

  return (
    <AdminLayout
      title="Gas Stations"
      subtitle={`${stations.length} registered in Taguig City (${activeCount} active)`}
      actions={
        <button type="button" onClick={openCreate} className="btn-primary text-xs sm:text-sm h-9 sm:h-10 px-3.5 gap-1.5 whitespace-nowrap">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" /> Add Station
        </button>
      }
    >
      {/* Filters */}
      <div className="space-y-3 mb-5">
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div role="group" aria-label="Filter stations by status" className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(f.id)}
                  className={`min-h-[40px] px-4 rounded-full border text-sm font-medium whitespace-nowrap inline-flex items-center gap-2 transition-colors ${
                    active ? "bg-white text-dark-900 border-white" : "bg-dark-800 text-slate-300 border-white/10 hover:text-white hover:border-white/25"
                  }`}
                >
                  {f.label}
                  <span className={`text-xs tabular-nums ${active ? "text-dark-600" : "text-slate-500"}`}>
                    {countFor(f.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <label htmlFor="station-filter-search" className="sr-only">Search stations</label>
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="station-filter-search"
            type="search"
            enterKeyHint="search"
            className="input-field min-h-[44px] pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
            placeholder="Search by station name, brand, barangay or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear station search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <LoadingBlock count={4} className="h-40" label="Loading stations…" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyBlock message={q || statusFilter !== "all" ? "No stations match your filters." : "No stations yet. Tap Add Station to create one."} />
      ) : (
        <>
          {/* Mobile / tablet: modern cards */}
          <ul className="lg:hidden space-y-3">
            {visible.map((s) => {
              const busy = busyId === s.station_id;
              return (
                <li key={s.station_id} className="glass-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-base leading-snug break-words">{s.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {s.brand || "Unbranded"}{s.barangay ? ` · ${s.barangay}` : ""} · {s.city}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${
                      s.status === "active"
                        ? "bg-success/10 text-success border-success/25"
                        : "bg-danger/10 text-danger border-danger/25"
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="min-w-0 break-words">{s.address}</span>
                  </p>

                  {s.contact_info && (
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
                      <span>{s.contact_info}</span>
                    </p>
                  )}

                  {s.fuel_prices?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.fuel_prices.map((fp) => (
                        <span key={fp.price_id} className="text-[11px] px-2 py-1 rounded-lg bg-dark-800 border border-white/10 text-slate-300">
                          {fp.fuel_type}: <strong className="text-primary">{peso(fp.price_per_liter)}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2">
                    <Link
                      to={`/admin/prices?station_id=${s.station_id}`}
                      className="btn-secondary text-xs h-9 px-2 gap-1.5"
                    >
                      <Banknote className="w-3.5 h-3.5" aria-hidden="true" /> Prices
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="btn-secondary text-xs h-9 px-2 gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(s)}
                      className="btn-danger text-xs h-9 px-2 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {busy ? <Spinner className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />} Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <div className="hidden lg:block glass-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-dark-800/40">
                <tr>
                  {["Station", "Brand", "Address", "Prices", "Status", "Actions"].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3.5 text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const busy = busyId === s.station_id;
                  return (
                    <tr key={s.station_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-white font-semibold">{s.name}</p>
                        {s.barangay && <p className="text-xs text-slate-500">{s.barangay}, {s.city}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{s.brand || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate" title={s.address}>{s.address}</td>
                      <td className="px-4 py-3.5">
                        {s.fuel_prices?.length ? (
                          <span className="text-xs text-slate-300">{s.fuel_prices.length} active</span>
                        ) : (
                          <span className="text-xs text-warning">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${
                          s.status === "active"
                            ? "bg-success/10 text-success border-success/25"
                            : "bg-danger/10 text-danger border-danger/25"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/prices?station_id=${s.station_id}`} className="text-xs btn-secondary px-3 py-1.5">
                            Prices
                          </Link>
                          <button type="button" onClick={() => openEdit(s)} className="text-xs btn-secondary px-3 py-1.5">
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => remove(s)}
                            className="text-xs btn-danger px-3 py-1.5 disabled:opacity-50"
                          >
                            {busy ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add / Edit Bottom Sheet (mobile) or Modal (desktop) */}
      <AdminSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editing ? "Edit Station" : "Add New Station"}
        subtitle="Stations must be located within Taguig City."
      >
        {formErr && (
          <div role="alert" className="bg-danger/10 border border-danger/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
            {formErr}
          </div>
        )}

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="st-name" className="label">Station Name</label>
            <input id="st-name" className="input-field min-h-[44px]" placeholder="e.g. Petron BGC 32nd St" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label htmlFor="st-brand" className="label">Brand</label>
            <input id="st-brand" className="input-field min-h-[44px]" placeholder="Petron, Shell, Caltex…" value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>

          <div>
            <label htmlFor="st-barangay" className="label">Barangay</label>
            <input id="st-barangay" className="input-field min-h-[44px]" placeholder="e.g. Fort Bonifacio" value={form.barangay}
              onChange={(e) => setForm({ ...form, barangay: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="st-address" className="label">Address</label>
            <input id="st-address" className="input-field min-h-[44px]" placeholder="Street / highway address" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>

          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="st-lat" className="label">Latitude</label>
              <input id="st-lat" className="input-field min-h-[44px]" type="number" inputMode="decimal" step="0.0000001"
                placeholder="14.5547" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="st-lng" className="label">Longitude</label>
              <input id="st-lng" className="input-field min-h-[44px]" type="number" inputMode="decimal" step="0.0000001"
                placeholder="121.0503" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
            </div>
          </div>

          {hasCoords && (
            <div className="sm:col-span-2 -mt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${form.latitude},${form.longitude}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary-light inline-flex items-center gap-1 py-1"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Verify coordinates in Google Maps
              </a>
            </div>
          )}

          <div>
            <label htmlFor="st-contact" className="label">Contact Info</label>
            <input id="st-contact" className="input-field min-h-[44px]" placeholder="Phone number (optional)" value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })} />
          </div>

          <div>
            <label htmlFor="st-status" className="label">Status</label>
            <select id="st-status" className="input-field min-h-[44px]" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="st-city" className="label">City</label>
            <input id="st-city" className="input-field min-h-[44px] text-slate-400" value={form.city} readOnly />
          </div>

          <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <button type="button" onClick={closeSheet} className="btn-secondary h-10 text-sm sm:px-5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 h-10 text-sm gap-2 disabled:opacity-60">
              {saving && <Spinner />}{editing ? "Save Changes" : "Create Station"}
            </button>
          </div>
        </form>
      </AdminSheet>

      <AdminToast message={toast.message} tone={toast.tone} />
    </AdminLayout>
  );
}
