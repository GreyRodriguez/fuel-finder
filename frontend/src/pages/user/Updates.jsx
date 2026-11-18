import { useState } from "react";
import { ExternalLink, TrendingUp, Megaphone } from "lucide-react";
import UserLayout from "../../components/UserLayout";
import Sparkline from "../../components/Sparkline";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import { FUEL_OPTIONS, peso, formatDate, DIRECTION_STYLE } from "../../utils/format";

const FUEL_TABS = ["All", ...FUEL_OPTIONS, "Kerosene"];

const RANGES = [
  { value: "4", label: "4w", fullLabel: "Last 4 weeks", weeks: 4 },
  { value: "8", label: "8w", fullLabel: "Last 8 weeks", weeks: 8 },
  { value: "12", label: "12w", fullLabel: "Last 12 weeks", weeks: 12 },
  { value: "all", label: "All", fullLabel: "All time", weeks: null },
];

function SectionHeading({ id, icon: Icon, title, hint }) {
  return (
    <div className="mb-3 md:mb-4">
      <h2 id={id} className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      {hint && <p className="text-xs md:text-sm text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function ForecastCard({ f }) {
  const style = DIRECTION_STYLE[f.direction];
  const headline =
    f.direction === "flat" ? "No change" : f.direction === "up" ? "Expected hike" : "Expected rollback";
  return (
    <article className="glass-card p-4 md:p-5" aria-label={`${f.fuel_type} forecast`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold">{f.fuel_type}</h3>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
          {headline}
        </span>
      </div>
      <p className={`mt-3 text-2xl sm:text-3xl font-black tabular-nums ${style.text}`}>
        <span aria-hidden="true">{style.arrow} </span>
        {f.direction === "flat" ? "₱0.00" : peso(Math.abs(f.change_per_liter))}
        <span className="text-sm font-semibold text-slate-400">/L</span>
      </p>
      <p className="text-xs text-slate-400 mt-2">Week of {formatDate(f.effective_date)}</p>
      <p className="text-xs text-slate-500 mt-0.5">Source: {f.source}</p>
      {f.notes && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{f.notes}</p>}
    </article>
  );
}

function MetricCard({ m }) {
  const style = DIRECTION_STYLE[m.direction ?? "flat"];
  const weeks = m.series.length;
  let changeText;
  if (m.change == null) changeText = "No previous week to compare yet";
  else if (m.direction === "flat") changeText = "No change vs last week";
  else changeText = `${peso(Math.abs(m.change))} vs last week`;

  return (
    <article className="glass-card p-4 md:p-5" aria-label={`${m.fuel_type} price trend`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold">{m.fuel_type}</h3>
        <span className="text-xs text-slate-500">{m.station_count} stations</span>
      </div>
      <p className="mt-2 text-2xl sm:text-3xl font-black text-white tabular-nums">
        {peso(m.current_avg)}
        <span className="text-sm font-semibold text-slate-400">/L</span>
      </p>
      <p className="text-xs text-slate-500">Current average</p>
      <p className={`mt-2 text-xs sm:text-sm font-semibold ${style.text}`}>
        {m.change != null && <span aria-hidden="true">{style.arrow} </span>}
        <span className="sr-only">
          {m.direction === "down" ? "Down " : m.direction === "up" ? "Up " : ""}
        </span>
        {changeText}
      </p>
      <div className="mt-3">
        <Sparkline data={m.series} stroke={style.stroke} label={`${m.fuel_type} weekly average`} />
        {weeks >= 2 && (
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>{formatDate(m.series[0].week_start, { month: "short", day: "numeric" })}</span>
            <span>{weeks} weeks</span>
            <span>{formatDate(m.series[weeks - 1].week_start, { month: "short", day: "numeric" })}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function AdvisoryItem({ a }) {
  return (
    <li className="glass-card p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
        <time dateTime={a.published_date} className="text-slate-400">{formatDate(a.published_date)}</time>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
          {a.source}
        </span>
        {a.fuel_type !== "All" && (
          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{a.fuel_type}</span>
        )}
      </div>
      <h3 className="text-white font-semibold mt-2 text-sm sm:text-base leading-snug">{a.title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-1.5 whitespace-pre-line leading-relaxed">{a.summary}</p>
      {a.source_url && (
        <a
          href={a.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline py-1
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
        >
          Read full advisory <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </li>
  );
}

export default function Updates() {
  const [fuel, setFuel] = useState("All");
  const [range, setRange] = useState("8");
  const rangeDef = RANGES.find((r) => r.value === range);

  const fuelParam = fuel === "All" ? undefined : fuel;
  const forecasts = useApiData("/api/updates/forecasts", { fuel_type: fuelParam });
  const trends = useApiData("/api/updates/trends", { fuel_type: fuelParam, weeks: rangeDef.weeks ?? 12 });
  const advisories = useApiData("/api/updates/advisories", { fuel_type: fuelParam, weeks: rangeDef.weeks ?? undefined });

  const grid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4";
  const filterLabel = fuel === "All" ? "" : ` for ${fuel}`;

  return (
    <UserLayout
      title="Updates & Price Trends"
      subtitle="Next-week outlook, weekly price movement and official energy advisories."
    >
      {/* Mobile-friendly pill filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div
          role="group"
          aria-label="Filter by fuel type"
          className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:flex sm:flex-wrap gap-2"
        >
          {FUEL_TABS.map((f) => {
            const active = fuel === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFuel(f)}
                className={`h-9 px-2.5 sm:px-3.5 rounded-full border text-xs sm:text-sm font-medium whitespace-nowrap text-center truncate transition-colors ${
                  active
                    ? "bg-white text-dark-900 border-white"
                    : "bg-dark-800 text-slate-300 border-white/10 hover:text-white hover:border-white/25"
                }`}
              >
                {f === "All" ? "All fuels" : f}
              </button>
            );
          })}
        </div>

        <div
          role="group"
          aria-label="Date range"
          className="grid grid-cols-4 sm:inline-grid w-full sm:w-auto gap-1 p-1 rounded-xl bg-dark-800 border border-white/10 flex-shrink-0"
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={range === r.value}
              aria-label={r.fullLabel}
              onClick={() => setRange(r.value)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                range === r.value ? "bg-dark-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Market forecast */}
      <section aria-labelledby="forecast-h" className="mb-7 md:mb-10">
        <SectionHeading id="forecast-h" icon={TrendingUp} title="Next-week market forecast" hint="Expected pump price movement for next week (₱ per liter)." />
        <div className={grid}>
          {forecasts.loading && <LoadingBlock count={3} className="h-44" label="Loading forecasts…" />}
          {forecasts.error && <ErrorBlock message={forecasts.error} onRetry={forecasts.reload} />}
          {!forecasts.loading && !forecasts.error && forecasts.data?.length === 0 && (
            <EmptyBlock message={`No forecast has been published${filterLabel} yet.`} />
          )}
          {!forecasts.loading && forecasts.data?.map((f) => <ForecastCard key={f.forecast_id} f={f} />)}
        </div>
      </section>

      {/* Fuel price change metrics */}
      <section aria-labelledby="trends-h" className="mb-7 md:mb-10">
        <SectionHeading id="trends-h" icon={TrendingUp} title="Fuel price changes" hint="Average pump price across Taguig stations, compared with last week." />
        <div className={grid}>
          {trends.loading && <LoadingBlock count={3} className="h-64" label="Loading price trends…" />}
          {trends.error && <ErrorBlock message={trends.error} onRetry={trends.reload} />}
          {!trends.loading && !trends.error && trends.data?.length === 0 && (
            <EmptyBlock message={`No pump-price trend is tracked${filterLabel}.`} />
          )}
          {!trends.loading && trends.data?.map((m) => <MetricCard key={m.fuel_type} m={m} />)}
        </div>
      </section>

      {/* Advisories */}
      <section aria-labelledby="advisories-h">
        <SectionHeading id="advisories-h" icon={Megaphone} title="Official energy advisories" hint="Newest first." />
        {advisories.loading && (
          <div className="grid gap-3"><LoadingBlock count={3} className="h-32" label="Loading advisories…" /></div>
        )}
        {advisories.error && <div className="grid"><ErrorBlock message={advisories.error} onRetry={advisories.reload} /></div>}
        {!advisories.loading && !advisories.error && advisories.data?.length === 0 && (
          <div className="grid"><EmptyBlock message={`No advisories${filterLabel} in this period.`} /></div>
        )}
        {!advisories.loading && advisories.data?.length > 0 && (
          <ul className="space-y-3">
            {advisories.data.map((a) => <AdvisoryItem key={a.advisory_id} a={a} />)}
          </ul>
        )}
      </section>
    </UserLayout>
  );
}
