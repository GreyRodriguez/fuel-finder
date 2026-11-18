import { useEffect, useState } from "react";
import { Search, X, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import api from "../../services/api";
import AdminLayout, { AdminToast } from "../../components/AdminLayout";
import { LoadingBlock, ErrorBlock, EmptyBlock, Spinner } from "../../components/DataStates";
import { useAuth } from "../../context/AuthContext";
import useApiData from "../../hooks/useApiData";
import useToast from "../../hooks/useToast";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "admin", label: "Admins" },
];

function initialsOf(name) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const { toast, show } = useToast();

  // Debounce search so rapid typing doesn't spam requests or cause race conditions
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload, mutate } = useApiData("/api/admin/users", q ? { q } : undefined);
  const users = data ?? [];

  const visible = users.filter((u) => {
    if (filter === "active") return u.status === "active";
    if (filter === "inactive") return u.status === "inactive";
    if (filter === "admin") return u.role === "admin";
    return true;
  });

  const counts = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  const toggleStatus = async (u) => {
    const newStatus = u.status === "active" ? "inactive" : "active";
    setBusyId(u.user_id);
    try {
      const { data: updated } = await api.put(`/api/admin/users/${u.user_id}`, { status: newStatus });
      mutate((list) => (list ?? []).map((x) => (x.user_id === u.user_id ? updated : x)));
      show(`${u.full_name} is now ${newStatus}.`);
    } catch (ex) {
      show(ex.response?.data?.detail || "Couldn't update user status.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete user ${u.full_name}? This cannot be undone.`)) return;
    setBusyId(u.user_id);
    try {
      await api.delete(`/api/admin/users/${u.user_id}`);
      mutate((list) => (list ?? []).filter((x) => x.user_id !== u.user_id));
      show(`Deleted ${u.full_name}.`);
    } catch (ex) {
      show(ex.response?.data?.detail || "Couldn't delete user.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle={`${users.length} account${users.length === 1 ? "" : "s"} · ${counts.active} active`}
    >
      {/* Filters + search */}
      <div className="space-y-3 mb-5">
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div role="group" aria-label="Filter users" className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={`min-h-[40px] px-4 rounded-full border text-sm font-medium whitespace-nowrap inline-flex items-center gap-2 transition-colors ${
                    active ? "bg-white text-dark-900 border-white" : "bg-dark-800 text-slate-300 border-white/10 hover:text-white hover:border-white/25"
                  }`}
                >
                  {f.label}
                  <span className={`text-xs tabular-nums ${active ? "text-dark-600" : "text-slate-500"}`}>
                    {counts[f.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <label htmlFor="user-search" className="sr-only">Search users</label>
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="user-search"
            type="search"
            enterKeyHint="search"
            className="input-field min-h-[44px] pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setQ(""); }}
              aria-label="Clear user search"
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
          <LoadingBlock count={4} className="h-36" label="Loading users…" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyBlock message={q || filter !== "all" ? "No users match these filters." : "No users found."} />
      ) : (
        <div className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* Mobile / tablet: user cards */}
          <ul className="lg:hidden space-y-3">
            {visible.map((u) => {
              const isSelf = currentUser?.user_id === u.user_id;
              const busy = busyId === u.user_id;
              return (
                <li key={u.user_id} className="glass-card p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {initialsOf(u.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold truncate">{u.full_name}</p>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-semibold text-slate-300 flex-shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 break-all">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary border-primary/25"
                          : "bg-accent/10 text-accent border-accent/25"
                      }`}>
                        {u.role === "admin" && <ShieldCheck className="w-3 h-3" aria-hidden="true" />}
                        {u.role}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full border font-medium ${
                        u.status === "active"
                          ? "bg-success/10 text-success border-success/25"
                          : "bg-danger/10 text-danger border-danger/25"
                      }`}>
                        {u.status}
                      </span>
                    </div>
                    <span className="text-slate-500">
                      Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy || isSelf}
                      onClick={() => toggleStatus(u)}
                      className="btn-secondary text-xs h-9 gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {busy ? <Spinner className="w-3.5 h-3.5" /> : u.status === "active"
                        ? <><UserX className="w-3.5 h-3.5" aria-hidden="true" /> Deactivate</>
                        : <><UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Activate</>}
                    </button>
                    <button
                      type="button"
                      disabled={busy || isSelf}
                      onClick={() => remove(u)}
                      className="btn-danger text-xs h-9 inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {busy ? <Spinner className="w-3.5 h-3.5" /> : <><Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete</>}
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
                  {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3.5 text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => {
                  const isSelf = currentUser?.user_id === u.user_id;
                  const busy = busyId === u.user_id;
                  return (
                    <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {initialsOf(u.full_name)}
                          </span>
                          <span className="text-white font-medium">{u.full_name}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-semibold text-slate-300">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary border-primary/25"
                            : "bg-accent/10 text-accent border-accent/25"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${
                          u.status === "active"
                            ? "bg-success/10 text-success border-success/25"
                            : "bg-danger/10 text-danger border-danger/25"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy || isSelf}
                            onClick={() => toggleStatus(u)}
                            className="text-xs btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {u.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            disabled={busy || isSelf}
                            onClick={() => remove(u)}
                            className="text-xs btn-danger px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminToast message={toast.message} tone={toast.tone} />
    </AdminLayout>
  );
}
