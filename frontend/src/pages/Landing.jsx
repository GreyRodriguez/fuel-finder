import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none glow-primary" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header navigation */}
      <header className="relative z-20 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
              <circle cx="7.5" cy="14.5" r="1.5"/>
              <circle cx="16.5" cy="14.5" r="1.5"/>
            </svg>
          </div>
          <span className="text-xl font-black text-white tracking-tight">Fuel<span className="text-primary">Finder</span></span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="btn-primary text-sm px-4 py-2"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-white text-sm transition-colors px-2 py-1"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" id="nav-login" className="text-slate-300 hover:text-white text-sm font-medium px-3 py-2 transition-colors">
                Log In
              </Link>
              <Link to="/register" id="nav-register" className="btn-primary text-sm px-4 py-2">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-6 max-w-2xl mx-auto py-12">
        {/* Logo badge */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
              <circle cx="7.5" cy="14.5" r="1.5"/>
              <circle cx="16.5" cy="14.5" r="1.5"/>
            </svg>
          </div>
          <span className="text-3xl font-black text-white tracking-tight">Fuel<span className="text-primary">Finder</span></span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
          Find the Cheapest<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">
            Gas in Taguig
          </span>
        </h1>

        <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          Real-time fuel prices from verified gas stations across Taguig City, Philippines.
          Compare, find, and save every time you fill up.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          {user ? (
            <>
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"} id="cta-dashboard" className="btn-primary text-lg px-8 py-4 flex-1">
                Go to Dashboard
              </Link>
              <Link to="/login" id="cta-login" className="btn-secondary text-lg px-8 py-4 flex-1">
                Sign In
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" id="cta-register" className="btn-primary text-lg px-8 py-4 flex-1">
                Sign Up — It's Free
              </Link>
              <Link to="/login" id="cta-login" className="btn-secondary text-lg px-8 py-4 flex-1">
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {["📍 Live Map", "⛽ Price Comparison", "🔍 Search Stations", "🚗 Nearest First"].map((f) => (
            <span key={f} className="glass-card px-4 py-2 text-sm text-slate-300">{f}</span>
          ))}
        </div>
      </main>
    </div>
  );
}
