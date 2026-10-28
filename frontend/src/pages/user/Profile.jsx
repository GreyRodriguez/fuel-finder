import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_new_password: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/user/profile").then((r) => {
      setProfile(r.data);
      setForm({ full_name: r.data.full_name, email: r.data.email });
    });
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      const r = await api.put("/api/user/profile", form);
      setProfile(r.data);
      setEditing(false);
      setMsg("Profile updated!");
    } catch (e) {
      setErr(e.response?.data?.detail || "Update failed");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      await api.put("/api/user/password", pwForm);
      setMsg("Password changed!");
      setPwForm({ current_password: "", new_password: "", confirm_new_password: "" });
    } catch (e) {
      setErr(e.response?.data?.detail || "Password change failed");
    }
  };

  return (
    <div className="min-h-dvh bg-dark-900">
      <nav className="bg-dark-800 border-b border-white/10 px-4 md:px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Dashboard
        </button>
        <span className="text-white font-bold text-lg">My Profile</span>
        <div className="ml-auto">
          <button onClick={() => { logout(); navigate("/"); }} className="btn-danger text-sm px-4 py-2">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {msg && <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">{msg}</div>}
        {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{err}</div>}

        {/* Profile info */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Account Info</h2>
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm px-4 py-2">
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
          {editing ? (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input id="profile-name" className="input-field" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input id="profile-email" type="email" className="input-field" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary w-full py-3">Save Changes</button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="label">Full Name</p>
                <p className="text-white font-medium">{profile?.full_name}</p>
              </div>
              <div>
                <p className="label">Email</p>
                <p className="text-white font-medium">{profile?.email}</p>
              </div>
              <div>
                <p className="label">Role</p>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {profile?.role}
                </span>
              </div>
              <div>
                <p className="label">Member since</p>
                <p className="text-slate-300 text-sm">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-white font-bold text-lg mb-5">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input id="pw-current" type="password" className="input-field" value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required />
            </div>
            <div>
              <label className="label">New Password</label>
              <input id="pw-new" type="password" className="input-field" value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input id="pw-confirm" type="password" className="input-field" value={pwForm.confirm_new_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_new_password: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary w-full py-3">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
