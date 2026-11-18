import { Link } from "react-router-dom";
import { MapPin, TrendingDown, Navigation, Fuel } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const HIGHLIGHTS = [
  { icon: MapPin, title: "Live Taguig Map", desc: "Locate nearby stations and distances from you." },
  { icon: TrendingDown, title: "Side-by-Side Prices", desc: "Compare Unleaded 91, Diesel and Premium 95." },
  { icon: Navigation, title: "Google Maps Route", desc: "One-tap driving directions to the pump." },
];

export default function Landing() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh bg-dark-900 flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[320px] h-[320px] md:w-[600px] md:h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none glow-primary" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header navigation */}
      <header className="relative z-20 border-b border-white/10 bg-dark-900/80 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
            <Fuel className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg sm:text-xl font-black text-white tracking-tight">Fuel<span className="text-primary">Finder</span></span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="btn-primary text-xs sm:text-sm h-9 px-3.5"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors px-2 py-1.5"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" id="nav-login" className="text-slate-300 hover:text-white text-xs sm:text-sm font-medium px-3 py-2 transition-colors">
                Log In
              </Link>
              <Link to="/register" id="nav-register" className="btn-primary text-xs sm:text-sm h-9 px-3.5">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto py-8 sm:py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Taguig City, Metro Manila
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight">
          Find the Cheapest<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-400">
            Gas in Taguig
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed">
          Real-time fuel prices from gas stations across Taguig City.
          Compare, find, and save every time you fill up.
        </p>

        {/* Action Buttons — sleek proportions on mobile & desktop */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs sm:max-w-sm">
          {user ? (
            <>
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"} id="cta-dashboard" className="btn-primary h-11 px-6 text-sm sm:text-base flex-1">
                Go to Dashboard
              </Link>
              <Link to="/login" id="cta-login" className="btn-secondary h-11 px-6 text-sm sm:text-base flex-1">
                Sign In
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" id="cta-register" className="btn-primary h-11 px-6 text-sm sm:text-base flex-1">
                Get Started
              </Link>
              <Link to="/login" id="cta-login" className="btn-secondary h-11 px-6 text-sm sm:text-base flex-1">
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Highlights */}
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 sm:mt-12 w-full text-left">
          {HIGHLIGHTS.map((h) => (
            <li key={h.title} className="glass-card p-4 flex sm:flex-col items-start gap-3 sm:gap-2">
              <span className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <h.icon className="w-4 h-4 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">{h.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{h.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
