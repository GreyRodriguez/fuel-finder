import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Calendar, LogOut, Eye, EyeOff, Pencil, Check, UserRound } from "lucide-react";
import UserLayout from "../../components/UserLayout";
import { LoadingBlock, ErrorBlock, Spinner } from "../../components/DataStates";
import { useAuth } from "../../context/AuthContext";
import useApiData from "../../hooks/useApiData";
import api from "../../services/api";

function PasswordInput({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="input-field min-h-[42px] pr-11"
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          {visible ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { data: profile, loading, error, reload, mutate } = useApiData("/api/user/profile");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_new_password: "" });
  const [savingPw, setSavingPw] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const initials = (profile?.full_name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const startEdit = () => {
    setForm({ full_name: profile?.full_name || "", email: profile?.email || "" });
    setErr("");
    setMsg("");
    setEditing(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (savingInfo) return;
    setErr("");
    setMsg("");
    setSavingInfo(true);
    try {
      const r = await api.put("/api/user/profile", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
      });
      mutate(r.data);
      updateUser({ full_name: r.data.full_name, email: r.data.email });
      setEditing(false);
      setMsg("Profile updated!");
    } catch (ex) {
      setErr(ex.response?.data?.detail || "Update failed.");
    } finally {
      setSavingInfo(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (savingPw) return;
    setErr("");
    setMsg("");
    if (pwForm.new_password.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_new_password) {
      setErr("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/api/user/password", pwForm);
      setMsg("Password changed!");
      setPwForm({ current_password: "", new_password: "", confirm_new_password: "" });
    } catch (ex) {
      setErr(ex.response?.data?.detail || "Password change failed.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <UserLayout title="My Profile" subtitle="Manage your account details and password." maxWidth="max-w-4xl">
      {msg && (
        <div role="status" className="bg-success/10 border border-success/25 text-success rounded-xl px-4 py-3 mb-5 text-sm">
          {msg}
        </div>
      )}
      {err && (
        <div role="alert" className="bg-danger/10 border border-danger/25 text-red-200 rounded-xl px-4 py-3 mb-5 text-sm">
          {err}
        </div>
      )}

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading && !profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <LoadingBlock count={2} className="h-64" label="Loading profile…" />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* Hero card */}
          <div className="glass-card p-4 sm:p-6 flex items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-lg sm:text-xl font-black text-white shadow-lg shadow-primary/25 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white truncate">{profile?.full_name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent border border-accent/25 inline-flex items-center gap-1">
                  <UserRound className="w-3 h-3" aria-hidden="true" /> {profile?.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 break-all mt-0.5">{profile?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { logout(); navigate("/"); }}
              aria-label="Logout"
              className="btn-danger h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
            {/* Account info */}
            <section className="glass-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-white font-bold text-base sm:text-lg">Account Info</h3>
                {!editing && (
                  <button type="button" onClick={startEdit} className="btn-secondary text-xs h-9 px-3 gap-1.5">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div>
                    <label htmlFor="profile-name" className="label">Full Name</label>
                    <input id="profile-name" className="input-field min-h-[42px]" value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="label">Email</label>
                    <input id="profile-email" type="email" inputMode="email" className="input-field min-h-[42px]" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary h-10 text-sm sm:px-4">
                      Cancel
                    </button>
                    <button type="submit" disabled={savingInfo} className="btn-primary flex-1 h-10 text-sm gap-1.5 disabled:opacity-60">
                      {savingInfo ? <Spinner /> : <Check className="w-4 h-4" aria-hidden="true" />} Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-3">
                  <div className="rounded-xl bg-dark-800/80 border border-white/5 p-3.5">
                    <dt className="text-xs text-slate-400 mb-0.5">Full Name</dt>
                    <dd className="text-white text-sm sm:text-base font-medium">{profile?.full_name}</dd>
                  </div>
                  <div className="rounded-xl bg-dark-800/80 border border-white/5 p-3.5">
                    <dt className="text-xs text-slate-400 mb-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Email
                    </dt>
                    <dd className="text-white text-sm sm:text-base font-medium break-all">{profile?.email}</dd>
                  </div>
                  <div className="rounded-xl bg-dark-800/80 border border-white/5 p-3.5">
                    <dt className="text-xs text-slate-400 mb-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Member since
                    </dt>
                    <dd className="text-slate-300 text-sm">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </dd>
                  </div>
                </dl>
              )}
            </section>

            {/* Change password */}
            <section className="glass-card p-4 sm:p-6">
              <h3 className="text-white font-bold text-base sm:text-lg mb-4">Change Password</h3>
              <form onSubmit={changePassword} className="space-y-4">
                <PasswordInput
                  id="pw-current"
                  label="Current Password"
                  autoComplete="current-password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                />
                <PasswordInput
                  id="pw-new"
                  label="New Password"
                  autoComplete="new-password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                />
                <PasswordInput
                  id="pw-confirm"
                  label="Confirm New Password"
                  autoComplete="new-password"
                  value={pwForm.confirm_new_password}
                  onChange={(e) => setPwForm({ ...pwForm, confirm_new_password: e.target.value })}
                />
                <button type="submit" disabled={savingPw} className="btn-primary w-full sm:w-auto h-10 px-6 text-sm gap-2 disabled:opacity-60">
                  {savingPw && <Spinner />} Update Password
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
