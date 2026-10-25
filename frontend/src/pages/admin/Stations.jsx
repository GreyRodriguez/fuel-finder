import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminNav from "../../components/AdminNav";

const EMPTY = { name: "", brand: "", address: "", barangay: "", city: "Taguig City", latitude: "", longitude: "", contact_info: "", status: "active" };

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = () => api.get("/api/admin/stations").then((r) => setStations(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      if (editing) {
        await api.put(`/api/admin/stations/${editing}`, form);
        setMsg("Station updated!");
      } else {
        await api.post("/api/admin/stations", form);
        setMsg("Station created!");
      }
      setForm(EMPTY); setEditing(null); setShowForm(false); load();
    } catch (ex) { setErr(ex.response?.data?.detail || "Error saving station"); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this station?")) return;
    await api.delete(`/api/admin/stations/${id}`);
    load();
  };

  const startEdit = (s) => {
    setForm({ name: s.name, brand: s.brand||"", address: s.address, barangay: s.barangay||"", city: s.city, latitude: s.latitude, longitude: s.longitude, contact_info: s.contact_info||"", status: s.status });
    setEditing(s.station_id); setShowForm(true); setErr(""); setMsg("");
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-dark-900 flex">
      <AdminNav />
      <main className="flex-1 h-screen overflow-y-auto p-8 min-w-0 overscroll-contain">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-white">Gas Stations</h1>
          <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(!showForm); setErr(""); setMsg(""); }} className="btn-primary text-sm px-5 py-2.5">
            {showForm ? "Cancel" : "+ Add Station"}
          </button>
        </div>

        {msg && <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm">{msg}</div>}
        {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{err}</div>}

        {showForm && (
          <div className="glass-card p-6 mb-6">
            <h2 className="text-white font-bold text-lg mb-4">{editing ? "Edit Station" : "Add New Station"}</h2>
            <form onSubmit={submit} className="grid grid-cols-2 gap-4">
              {[["name","Station Name","text",true],["brand","Brand","text",false],["address","Address","text",true],["barangay","Barangay","text",false],["contact_info","Contact Info","text",false]].map(([k,l,t,req])=>(
                <div key={k} className={k === "address" ? "col-span-2" : ""}>
                  <label className="label">{l}</label>
                  <input className="input-field" type={t} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} required={req} />
                </div>
              ))}
              <div>
                <label className="label">Latitude</label>
                <input className="input-field" type="number" step="0.0000001" value={form.latitude} onChange={(e)=>setForm({...form,latitude:e.target.value})} required />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input className="input-field" type="number" step="0.0000001" value={form.longitude} onChange={(e)=>setForm({...form,longitude:e.target.value})} required />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input-field" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} required />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input-field" value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-span-2">
                <button type="submit" className="btn-primary px-8 py-3">{editing ? "Update Station" : "Create Station"}</button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                {["Name","Brand","Address","City","Status","Actions"].map((h)=>(
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.station_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-300">{s.brand || "—"}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{s.address}</td>
                  <td className="px-4 py-3 text-slate-400">{s.city}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => startEdit(s)} className="text-xs btn-secondary px-3 py-1.5">Edit</button>
                    <button onClick={() => remove(s.station_id)} className="text-xs btn-danger px-3 py-1.5">Delete</button>
                  </td>
                </tr>
              ))}
              {stations.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No stations yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
