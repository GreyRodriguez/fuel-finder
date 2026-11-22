import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Fuel,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PREVIEW_FUELS = {
  "Unleaded 91": {
    cheapest: { name: "Flying V Gen. Santos Ave", area: "Upper Bicutan · 1.4 km", price: 68.93 },
    higher: { name: "Petron C-5 Diego Silang", area: "Ususan · 1.8 km", price: 74.10 },
    savings: 5.17,
    tankSave: 233,
  },
  "Premium 95": {
    cheapest: { name: "Flying V Gen. Santos Ave", area: "Upper Bicutan · 1.4 km", price: 72.63 },
    higher: { name: "Petron BGC 32nd St.", area: "Fort Bonifacio · 2.3 km", price: 77.95 },
    savings: 5.32,
    tankSave: 239,
  },
  Diesel: {
    cheapest: { name: "Flying V Gen. Santos Ave", area: "Upper Bicutan · 1.4 km", price: 85.78 },
    higher: { name: "Petron C-5 Diego Silang", area: "Ususan · 1.8 km", price: 89.20 },
    savings: 3.42,
    tankSave: 154,
  },
};

const COMPARE_SAMPLE = [
  { name: "Flying V Gen. Santos Ave", area: "Upper Bicutan", price: "₱68.93", delta: "Lowest", lowest: true },
  { name: "SEAOIL Taguig Diversion", area: "Ususan", price: "₱74.28", delta: "+₱5.35/L", lowest: false },
  { name: "Petron C-5 Diego Silang", area: "Ususan", price: "₱74.10", delta: "+₱5.17/L", lowest: false },
];

const ROUTE_MODES = {
  nearest: [
    { name: "Petron C-5 Diego Silang", meta: "1.1 km · 4 min drive", price: "₱74.10", tag: "Closest" },
    { name: "Flying V Gen. Santos Ave", meta: "1.8 km · 6 min drive", price: "₱68.93", tag: "Save ₱5.17/L" },
  ],
  cheapest: [
    { name: "Flying V Gen. Santos Ave", meta: "1.8 km · 6 min drive", price: "₱68.93", tag: "Best rate" },
    { name: "Flying V Central Signal", meta: "2.1 km · 7 min drive", price: "₱69.25", tag: "+₱0.32/L" },
  ],
};

const STATS = [
  { value: "28+", label: "Taguig Stations Tracked", sub: "Upper Bicutan, Ususan, Signal & BGC" },
  { value: "Weekly", label: "DOE Price Advisories", sub: "Tuesday rollbacks & hikes monitored" },
  { value: "Verified", label: "Community Pump Checks", sub: "Driver-submitted spot reports" },
];

const HOW_STEPS = [
  {
    num: "01",
    title: "See pumps around Taguig",
    desc: "Open the live map to locate nearby stations with real-time distance and current unleaded, premium, and diesel rates.",
  },
  {
    num: "02",
    title: "Compare before you detour",
    desc: "Pick up to 4 stations side by side to check whether a short 2-minute detour saves you hundreds per full tank.",
  },
  {
    num: "03",
    title: "Time your fill-up with DOE trends",
    desc: "Check next-week rollback and hike forecasts so you fill up early before a hike—or wait a day for a drop.",
  },
];

export default function Landing() {
  const { user, logout } = useAuth();
  const [selectedFuel, setSelectedFuel] = useState("Unleaded 91");
  const [routeMode, setRouteMode] = useState("cheapest");

  const activeFuel = PREVIEW_FUELS[selectedFuel];
  const appPath = user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/register";
  const forecastPath = user?.role === "admin" ? "/admin/updates" : "/updates";

  return (
    <div className="ff-user min-h-dvh bg-[#090B10] text-[#F8FAFC] flex flex-col overflow-x-hidden selection:bg-orange-500/30 selection:text-white">
      {/* Subtle architectural top light sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(249,115,22,0.10),transparent_70%)]"
      />

      {/* 1. Floating Glass Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090B10]/75 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 min-h-11 pr-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <span className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Fuel className="w-4 h-4 text-zinc-950" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#F8FAFC]">
              Fuel<span className="text-orange-400">Finder</span>
            </span>
          </Link>

          <nav aria-label="Landing sections" className="hidden md:flex items-center gap-1">
            {[
              { href: "#live-preview", label: "Live Map" },
              { href: "#features", label: "Price Trends" },
              { href: "#how-it-works", label: "How It Works" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-11 px-3.5 inline-flex items-center text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-11 px-3 text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  Log Out
                </button>
                <Link
                  to={appPath}
                  id="nav-open-app"
                  className="inline-flex items-center justify-center min-h-11 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  id="nav-login"
                  className="inline-flex items-center justify-center min-h-11 px-3 text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg transition-colors duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  id="nav-register"
                  className="inline-flex items-center justify-center min-h-11 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* 2. Hero Section with Live Interactive Preview */}
        <section
          id="live-preview"
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-24 lg:pb-28"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Hero Copy */}
            <div className="lg:col-span-6 min-w-0 ff-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-[#94A3B8] mb-6 max-w-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">Live Taguig City Pump Prices • Updated Weekly</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#F8FAFC] tracking-tighter leading-[1.08] mb-5">
                Find the cheapest pump in Taguig before you drive.
              </h1>

              <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-xl mb-8">
                Compare verified Unleaded 91, Premium 95, and Diesel rates across 28+ Taguig stations,
                track weekly DOE adjustments, and route straight to the lowest price.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Link
                  to={appPath}
                  id={user ? "cta-dashboard" : "cta-register"}
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-semibold text-sm sm:text-base transition-all duration-200 active:scale-[0.98]"
                >
                  Launch Dashboard
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <Link
                  to={forecastPath}
                  id="cta-forecast"
                  className="inline-flex items-center justify-center gap-2 min-h-11 px-5 py-3 rounded-xl text-[#F8FAFC] hover:bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.18] font-medium text-sm sm:text-base transition-all duration-200"
                >
                  View Weekly Forecast
                  <ArrowRight className="w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Interactive Framed Preview Mockup */}
            <div className="lg:col-span-6 min-w-0 ff-fade-up ff-delay-1">
              <div className="relative rounded-2xl bg-[#111520] border border-white/[0.08] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Mockup top bar + live fuel switcher */}
                <div className="px-4 py-3 border-b border-white/[0.06] bg-[#0D1018]/90 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs font-semibold text-[#F8FAFC] truncate">Taguig Live Map</span>
                  </div>
                  <div
                    role="group"
                    aria-label="Preview fuel type"
                    className="flex items-center gap-1 p-0.5 rounded-lg bg-[#090B10] border border-white/[0.06]"
                  >
                    {Object.keys(PREVIEW_FUELS).map((fuel) => {
                      const active = selectedFuel === fuel;
                      return (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setSelectedFuel(fuel)}
                          aria-pressed={active}
                          className={`min-h-11 sm:min-h-8 px-2.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                            active
                              ? "bg-white/[0.1] text-[#F8FAFC]"
                              : "text-[#94A3B8] hover:text-[#F8FAFC]"
                          }`}
                        >
                          {fuel === "Unleaded 91" ? "U91" : fuel === "Premium 95" ? "P95" : "Diesel"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stylized dark Taguig cartographic map canvas */}
                <div className="relative h-56 sm:h-64 bg-[#0B0E15] overflow-hidden">
                  <svg
                    viewBox="0 0 560 280"
                    fill="none"
                    aria-hidden="true"
                    className="w-full h-full object-cover opacity-90"
                  >
                    {/* Subtle urban grid & Laguna Bay shoreline */}
                    <path d="M460 0 C475 75, 495 155, 535 280 L560 280 L560 0 Z" fill="#0E1726" />
                    {/* Secondary streets */}
                    <g stroke="rgba(148,163,184,0.09)" strokeWidth="1">
                      <path d="M40 30 L420 55" />
                      <path d="M25 90 L445 125" />
                      <path d="M10 155 L465 188" />
                      <path d="M55 215 L485 242" />
                      <path d="M110 10 L85 270" />
                      <path d="M210 5 L180 275" />
                      <path d="M325 12 L290 272" />
                      <path d="M415 20 L385 268" />
                    </g>
                    {/* Major Taguig corridors: C-5 & Gen. Santos Ave */}
                    <path
                      d="M170 0 C185 80, 210 165, 255 280"
                      stroke="rgba(148,163,184,0.22)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M65 210 C155 185, 250 155, 365 135"
                      stroke="rgba(249,115,22,0.38)"
                      strokeWidth="2.5"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    />
                    {/* Active route highlight from user dot to Flying V */}
                    <path
                      d="M272 152 Q215 170 148 192"
                      stroke="#F97316"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Map corridor labels */}
                  <span className="absolute top-3 left-3 text-[11px] font-medium text-slate-500 tracking-wide uppercase">
                    C-5 · BGC · Upper Bicutan
                  </span>

                  {/* Pin: Higher price station (Petron) */}
                  <div className="absolute top-12 right-6 sm:right-12 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111520]/95 border border-white/[0.12] shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-slate-400" aria-hidden="true" />
                    <span className="text-xs font-semibold text-slate-300 tabular-nums">
                      ₱{activeFuel.higher.price.toFixed(2)}
                    </span>
                  </div>

                  {/* User position blue dot */}
                  <div
                    aria-hidden="true"
                    className="absolute top-[52%] left-[48%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/25 border-2 border-white"
                  />

                  {/* Pin: Cheapest station (Flying V) */}
                  <div className="absolute bottom-8 left-5 sm:left-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-zinc-950 shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-zinc-950" aria-hidden="true" />
                    <span className="text-xs font-bold tabular-nums">
                      ₱{activeFuel.cheapest.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Lowest</span>
                  </div>
                </div>

                {/* Live Station Comparison Card overlay */}
                <div className="p-4 sm:p-5 bg-[#111520] border-t border-white/[0.06]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                    <span className="text-xs font-medium text-[#94A3B8]">
                      {selectedFuel} · Best nearby spread
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tabular-nums">
                      <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                      Save ₱{activeFuel.savings.toFixed(2)}/L
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.06] rounded-xl bg-[#090B10]/70 border border-white/[0.06]">
                    <div className="px-3.5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F8FAFC] truncate">
                          {activeFuel.cheapest.name}
                        </p>
                        <p className="text-xs text-[#94A3B8] truncate">{activeFuel.cheapest.area}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-emerald-400 tabular-nums">
                          ₱{activeFuel.cheapest.price.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-emerald-400/80 font-medium">Cheapest</p>
                      </div>
                    </div>

                    <div className="px-3.5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-300 truncate">
                          {activeFuel.higher.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{activeFuel.higher.area}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-semibold text-slate-300 tabular-nums">
                          ₱{activeFuel.higher.price.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          +₱{activeFuel.savings.toFixed(2)}/L
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-[#94A3B8]">
                    <span>Estimated 45L full-tank savings</span>
                    <span className="font-semibold text-[#F8FAFC] tabular-nums">
                      ~₱{activeFuel.tankSave} saved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Live Ticker / Quick Stats Strip (Borderless with hairline dividers) */}
        <section aria-label="Platform highlights" className="border-y border-white/[0.06] bg-[#0D1018]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <dl className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {STATS.map((stat) => (
                <div key={stat.label} className="py-6 sm:py-8 md:px-8 first:md:pl-0 last:md:pr-0">
                  <dt className="text-xs font-medium uppercase tracking-wider text-orange-400/90">
                    {stat.label}
                  </dt>
                  <dd className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-sm text-[#94A3B8]">{stat.sub}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 4. Asymmetric 2-Row Bento Showcase */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">
              Built for Taguig Commuters
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter leading-[1.08] text-[#F8FAFC]">
              Every pump decision, answered in seconds.
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8] mt-3 leading-relaxed">
              No clutter, no guesswork. Real station prices, weekly DOE movement, and quick route trade-offs in one clean workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
            {/* Card 1 (Wide): Side-by-Side Station Comparison */}
            <article className="md:col-span-7 rounded-2xl bg-[#111520] border border-white/[0.07] hover:border-white/[0.13] transition-all duration-200 p-6 sm:p-7 flex flex-col justify-between gap-6 min-w-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#F8FAFC]">
                  Side-by-Side Station Comparison
                </h3>
                <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
                  Stack up to 4 stations across Taguig and spot the real peso difference per full tank immediately.
                </p>
              </div>

              <div className="rounded-xl bg-[#090B10] border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                  <span>Unleaded 91 · 3 stations</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">Save ₱232.65 / 45L tank</span>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {COMPARE_SAMPLE.map((row) => (
                    <div
                      key={row.name}
                      className={`px-4 py-3 flex items-center justify-between gap-3 ${
                        row.lowest ? "bg-emerald-500/[0.06]" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F8FAFC] truncate">{row.name}</p>
                        <p className="text-xs text-slate-500 truncate">{row.area}</p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                            row.lowest
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "text-slate-500"
                          }`}
                        >
                          {row.delta}
                        </span>
                        <span
                          className={`text-sm sm:text-base font-bold tabular-nums ${
                            row.lowest ? "text-emerald-400" : "text-slate-200"
                          }`}
                        >
                          {row.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* Card 2 (Compact): Nearest vs. Cheapest Toggle */}
            <article className="md:col-span-5 rounded-2xl bg-[#111520] border border-white/[0.07] hover:border-white/[0.13] transition-all duration-200 p-6 sm:p-7 flex flex-col justify-between gap-6 min-w-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#F8FAFC]">
                  Nearest vs. Cheapest Toggle
                </h3>
                <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
                  Flip between shortest drive and lowest pump price, then launch turn-by-turn Google Maps directions in one tap.
                </p>
              </div>

              <div className="space-y-3">
                <div
                  role="group"
                  aria-label="Preview sort mode"
                  className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#090B10] border border-white/[0.07]"
                >
                  {[
                    { id: "nearest", label: "Nearest", icon: LocateFixed },
                    { id: "cheapest", label: "Cheapest", icon: TrendingDown },
                  ].map((mode) => {
                    const active = routeMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setRouteMode(mode.id)}
                        aria-pressed={active}
                        className={`min-h-11 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          active
                            ? "bg-orange-500 text-zinc-950"
                            : "text-[#94A3B8] hover:text-[#F8FAFC]"
                        }`}
                      >
                        <mode.icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {ROUTE_MODES[routeMode].map((item, idx) => (
                    <div
                      key={item.name}
                      className={`rounded-xl px-3.5 py-3 border flex items-center justify-between gap-3 transition-colors duration-200 ${
                        idx === 0
                          ? "bg-[#090B10] border-orange-500/35"
                          : "bg-[#090B10]/50 border-white/[0.05]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F8FAFC] truncate">{item.name}</p>
                        <p className="text-xs text-[#94A3B8] inline-flex items-center gap-1 mt-0.5">
                          <Navigation className="w-3 h-3 text-cyan-400 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.meta}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#F8FAFC] tabular-nums">{item.price}</p>
                        <p className="text-[11px] text-orange-400 font-medium">{item.tag}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* Card 3 (Compact): Weekly Rollback & Hike Forecasts */}
            <article className="md:col-span-5 rounded-2xl bg-[#111520] border border-white/[0.07] hover:border-white/[0.13] transition-all duration-200 p-6 sm:p-7 flex flex-col justify-between gap-6 min-w-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#F8FAFC]">
                  Weekly Rollback &amp; Hike Forecasts
                </h3>
                <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
                  Track DOE weekly price direction with 8-week average trends before every Tuesday adjustment.
                </p>
              </div>

              <div className="rounded-xl bg-[#090B10] border border-white/[0.06] p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs text-[#94A3B8]">Unleaded 91 · 8-wk avg</p>
                    <p className="text-2xl font-extrabold text-[#F8FAFC] tabular-nums mt-0.5">
                      ₱71.40<span className="text-xs font-medium text-slate-500">/L</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tabular-nums">
                    ▼ ₱0.85/L
                  </span>
                </div>

                {/* Smooth SVG Sparkline */}
                <svg viewBox="0 0 240 68" className="w-full h-16 overflow-visible" role="img" aria-label="8-week DOE fuel price rollback trend">
                  <defs>
                    <linearGradient id="landingSparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 4 24 C 36 22, 48 12, 78 16 C 108 20, 126 32, 158 30 C 188 28, 206 46, 236 52 L 236 68 L 4 68 Z"
                    fill="url(#landingSparkFill)"
                  />
                  <path
                    d="M 4 24 C 36 22, 48 12, 78 16 C 108 20, 126 32, 158 30 C 188 28, 206 46, 236 52"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="236" cy="52" r="4.5" fill="#22C55E" stroke="#090B10" strokeWidth="2" />
                </svg>

                <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>8 weeks ago</span>
                  <span>Expected Tuesday rollback</span>
                </div>
              </div>
            </article>

            {/* Card 4 (Wide): Crowdsourced Pump Accuracy */}
            <article className="md:col-span-7 rounded-2xl bg-[#111520] border border-white/[0.07] hover:border-white/[0.13] transition-all duration-200 p-6 sm:p-7 flex flex-col justify-between gap-6 min-w-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#F8FAFC]">
                  Crowdsourced Pump Accuracy
                </h3>
                <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
                  Spot a different board price at the pump? Submit a 10-second report. Every discrepancy is cross-checked against DOE advisories and refreshed on the live map.
                </p>
              </div>

              <div className="rounded-xl bg-[#090B10] border border-white/[0.06] p-4 sm:p-5">
                <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                  {[
                    {
                      step: "Driver report",
                      detail: "Flying V U91 · ₱68.93",
                      badge: "Submitted",
                      tone: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                      icon: MapPin,
                    },
                    {
                      step: "Cross-check",
                      detail: "Matched vs DOE watch",
                      badge: "Reviewed",
                      tone: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                      icon: ShieldCheck,
                    },
                    {
                      step: "Live on map",
                      detail: "Updated for Taguig",
                      badge: "Verified",
                      tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                      icon: CheckCircle2,
                    },
                  ].map((item) => (
                    <li
                      key={item.step}
                      className="flex sm:flex-col items-center sm:items-start justify-between gap-3 rounded-xl bg-[#111520] border border-white/[0.06] p-3.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className="w-4 h-4 text-[#94A3B8] flex-shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F8FAFC] truncate">{item.step}</p>
                          <p className="text-[11px] text-[#94A3B8] truncate">{item.detail}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${item.tone}`}>
                        {item.badge}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          </div>
        </section>

        {/* How It Works — Clean Editorial Strip (No repetitive boxes) */}
        <section id="how-it-works" className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">
                  How It Works
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter leading-[1.08] text-[#F8FAFC]">
                  Three steps to a cheaper full tank.
                </h2>
              </div>
              <Link
                to={appPath}
                className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Explore Live Map <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {HOW_STEPS.map((s) => (
                <li key={s.num} className="border-t border-white/[0.09] pt-6">
                  <span className="text-xs font-mono font-semibold text-orange-400">{s.num}</span>
                  <h3 className="text-lg font-bold tracking-tight text-[#F8FAFC] mt-2.5">{s.title}</h3>
                  <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. Final CTA Banner */}
        <section className="bg-[#111520] border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter leading-[1.08] text-[#F8FAFC]">
                Stop overpaying at the pump.
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] mt-3 leading-relaxed">
                Check live Taguig City gas station prices in seconds before your next fill-up.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to={appPath}
                className="inline-flex items-center justify-center gap-2 min-h-11 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-semibold text-sm sm:text-base w-full sm:w-auto transition-all duration-200 active:scale-[0.98]"
              >
                {user ? "Open Dashboard" : "Get Started Free"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Minimalist Single-Row Footer */}
      <footer className="border-t border-white/[0.06] bg-[#090B10] pb-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Fuel className="w-3.5 h-3.5 text-zinc-950" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-[#F8FAFC]">
              Fuel<span className="text-orange-400">Finder</span>
            </span>
            <span className="text-xs text-slate-500">· Taguig City, Metro Manila</span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#94A3B8]">
            <Link to={appPath} className="hover:text-[#F8FAFC] py-2 transition-colors">
              Live Map
            </Link>
            <Link to={forecastPath} className="hover:text-[#F8FAFC] py-2 transition-colors">
              Price Trends
            </Link>
            <Link to="/feedback" className="hover:text-[#F8FAFC] py-2 transition-colors">
              Feedback
            </Link>
            <Link to="/about" className="hover:text-[#F8FAFC] py-2 transition-colors">
              About Us
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
