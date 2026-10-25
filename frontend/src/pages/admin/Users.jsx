import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminNav from "../../components/AdminNav";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const load = (q = "") => api.get(`/api/admin/users${q ? `?q=${q}` : ""}`).then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const toggleStatus = async (u) => {
    const newStatus = u.status === "active" ? "inactive" : "active";
    await api.put(`/api/admin/users/${u.user_id}`, { status: newStatus });
    setMsg(`${u.full_name} is now ${newStatus}.`);
    load(search);
  };

  const remove = async (u) => {
    if (!confirm(`Delete user ${u.full_name}?`)) return;
    await api.delete(`/api/admin/users/${u.user_id}`);
    setMsg("User deleted.");
    load(search);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-dark-900 flex">
      <AdminNav />
      <main className="flex-1 h-screen overflow-y-auto p-8 min-w-0 overscroll-contain">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-black text-white">User Management</h1>
          <input
            id="user-search"
            className="input-field max-w-xs"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          />
        </div>

        {msg && <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm">{msg}</div>}

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                {["Name","Email","Role","Status","Joined","Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => toggleStatus(u)} className="text-xs btn-secondary px-3 py-1.5">
                      {u.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => remove(u)} className="text-xs btn-danger px-3 py-1.5">Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
