import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function AdminNav() {
  return (
    <aside className="w-64 flex-shrink-0 bg-dark-800 border-r border-white/10">
      <div className="p-6 border-b border-white/10"><Link to="/admin" className="text-xl font-black text-white">Fuel<span className="text-primary">Finder</span> <span className="text-xs text-primary">Admin</span></Link></div>
      <nav className="p-4 space-y-1">
        {[{to:"/admin",l:"📊 Dashboard"},{to:"/admin/stations",l:"⛽ Stations"},{to:"/admin/prices",l:"💰 Prices"},{to:"/admin/users",l:"👥 Users"},{to:"/admin/reports",l:"📈 Reports"},{to:"/admin/profile",l:"👤 Profile"}].map(n=>(
          <Link key={n.to} to={n.to} className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-dark-700 transition-all font-medium text-sm">{n.l}</Link>
        ))}
      </nav>
    </aside>
  );
}

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_new_password: "" });
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");

  useEffect(() => { api.get("/api/user/profile").then((r) => setProfile(r.data)); }, []);

  const changePassword = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      await api.put("/api/user/password", pwForm);
      setMsg("Password changed successfully!");
      setPwForm({ current_password: "", new_password: "", confirm_new_password: "" });
    } catch (ex) { setErr(ex.response?.data?.detail || "Error"); }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminNav />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-black text-white mb-6">Admin Profile</h1>
        {msg && <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm">{msg}</div>}
        {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{err}</div>}

        <div className="max-w-lg space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-white font-bold text-lg mb-4">Account Info</h2>
            <div className="space-y-3">
              <div><p className="label">Full Name</p><p className="text-white font-medium">{profile?.full_name}</p></div>
              <div><p className="label">Email</p><p className="text-white font-medium">{profile?.email}</p></div>
              <div><p className="label">Role</p><span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">{profile?.role}</span></div>
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-white font-bold text-lg mb-5">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div><label className="label">Current Password</label><input type="password" className="input-field" value={pwForm.current_password} onChange={(e)=>setPwForm({...pwForm,current_password:e.target.value})} required /></div>
              <div><label className="label">New Password</label><input type="password" className="input-field" value={pwForm.new_password} onChange={(e)=>setPwForm({...pwForm,new_password:e.target.value})} required /></div>
              <div><label className="label">Confirm New Password</label><input type="password" className="input-field" value={pwForm.confirm_new_password} onChange={(e)=>setPwForm({...pwForm,confirm_new_password:e.target.value})} required /></div>
              <button type="submit" className="btn-primary w-full py-3">Update Password</button>
            </form>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="btn-danger w-full py-3">Logout</button>
        </div>
      </main>
    </div>
  );
}
