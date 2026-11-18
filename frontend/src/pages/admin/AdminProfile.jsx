import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Calendar, LogOut, Eye, EyeOff, Pencil, Check } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AdminLayout, { AdminToast } from "../../components/AdminLayout";
import { LoadingBlock, ErrorBlock, Spinner } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import useToast from "../../hooks/useToast";

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
          className="input-field min-h-[44px] pr-11"
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          {visible ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { data: profile, loading, error, reload, mutate } = useApiData("/api/user/profile");
  const { toast, show } = useToast();

  const [editing, setEditing] = useState(false);
  const [infoForm, setInfoForm] = useState({ full_name: "", email: "" });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoErr, setInfoErr] = useState("");

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_new_password: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwErr, setPwErr] = useState("");

  const initials = (profile?.full_name || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const startEdit = () => {
    setInfoForm({ full_name: profile?.full_name || "", email: profile?.email || "" });
    setInfoErr("");
    setEditing(true);
  };

  const saveInfo = async (e) => {
    e.preventDefault();
    if (savingInfo) return;
    setSavingInfo(true);
    setInfoErr("");
    try {
      const { data: updated } = await api.put("/api/user/profile", {
        full_name: infoForm.full_name.trim(),
        email: infoForm.email.trim(),
      });
      mutate(updated);
      updateUser({ full_name: updated.full_name, email: updated.email });
      setEditing(false);
      show("Profile updated.");
    } catch (ex) {
      setInfoErr(ex.response?.data?.detail || "Couldn't update profile.");
    } finally {
      setSavingInfo(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (savingPw) return;
    setPwErr("");
    if (pwForm.new_password.length < 6) {
      setPwErr("New password must be at least 6 characters.");
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_new_password) {
      setPwErr("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/api/user/password", pwForm);
      setPwForm({ current_password: "", new_password: "", confirm_new_password: "" });
      show("Password updated successfully.");
    } catch (ex) {
      setPwErr(ex.response?.data?.detail || "Couldn't change password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <AdminLayout
      title="Admin Profile"
      subtitle="Manage your administrator account and password."
    >
      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading && !profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <LoadingBlock count={2} className="h-64" label="Loading profile…" />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* Hero banner */}
          <div className="glass-card p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-primary/25 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-white truncate">{profile?.full_name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> {profile?.role}
                </span>
              </div>
              <p className="text-sm text-slate-400 break-all mt-0.5">{profile?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { logout(); navigate("/"); }}
              className="btn-danger min-h-[44px] px-4 inline-flex items-center justify-center gap-2 text-sm w-full sm:w-auto flex-shrink-0"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" /> Logout
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
            {/* Account info */}
            <section className="glass-card p-4 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="text-white font-bold text-lg">Account Info</h3>
                {!editing && (
                  <button type="button" onClick={startEdit} className="btn-secondary text-xs min-h-[40px] px-3.5 gap-1.5">
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                  </button>
                )}
              </div>

              {infoErr && (
                <div role="alert" className="bg-danger/10 border border-danger/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
                  {infoErr}
                </div>
              )}

              {editing ? (
                <form onSubmit={saveInfo} className="space-y-4">
                  <div>
                    <label htmlFor="adm-name" className="label">Full Name</label>
                    <input id="adm-name" className="input-field min-h-[44px]" value={infoForm.full_name}
                      onChange={(e) => setInfoForm({ ...infoForm, full_name: e.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="adm-email" className="label">Email</label>
                    <input id="adm-email" type="email" inputMode="email" className="input-field min-h-[44px]" value={infoForm.email}
                      onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })} required />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary min-h-[44px] sm:px-5">
                      Cancel
                    </button>
                    <button type="submit" disabled={savingInfo} className="btn-primary flex-1 min-h-[44px] gap-2 disabled:opacity-60">
                      {savingInfo ? <Spinner /> : <Check className="w-4 h-4" aria-hidden="true" />} Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-4">
                  <div className="rounded-xl bg-dark-800/80 border border-white/5 p-3.5">
                    <dt className="text-xs text-slate-400 mb-1">Full Name</dt>
                    <dd className="text-white font-medium">{profile?.full_name}</dd>
                  </div>
                  <div className="rounded-xl bg-dark-800/80 border border-white/5 p-3.5">
                    <dt className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Email
                    </dt>
                    <dd className="text-white font-medium break-all">{profile?.email}</dd>
                  </div>
                  <div className="rounded-xl bg-dark-800/80 border border-white/5 p-3.5">
                    <dt className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Member Since
                    </dt>
                    <dd className="text-slate-300 text-sm">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </dd>
                  </div>
                </dl>
              )}
            </section>

            {/* Change password */}
            <section className="glass-card p-4 md:p-6">
              <h3 className="text-white font-bold text-lg mb-5">Change Password</h3>
              {pwErr && (
                <div role="alert" className="bg-danger/10 border border-danger/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
                  {pwErr}
                </div>
              )}
              <form onSubmit={changePassword} className="space-y-4">
                <PasswordInput
                  id="adm-pw-current"
                  label="Current Password"
                  autoComplete="current-password"
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                />
                <PasswordInput
                  id="adm-pw-new"
                  label="New Password"
                  autoComplete="new-password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                />
                <PasswordInput
                  id="adm-pw-confirm"
                  label="Confirm New Password"
                  autoComplete="new-password"
                  value={pwForm.confirm_new_password}
                  onChange={(e) => setPwForm({ ...pwForm, confirm_new_password: e.target.value })}
                />
                <button type="submit" disabled={savingPw} className="btn-primary w-full min-h-[48px] gap-2 disabled:opacity-60">
                  {savingPw && <Spinner />} Update Password
                </button>
              </form>
            </section>
          </div>
        </div>
      )}

      <AdminToast message={toast.message} tone={toast.tone} />
    </AdminLayout>
  );
}
