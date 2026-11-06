import { useState } from "react";
import { ExternalLink, TrendingUp, Megaphone } from "lucide-react";
import UserLayout from "../../components/UserLayout";
import Sparkline from "../../components/Sparkline";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../../components/DataStates";
import useApiData from "../../hooks/useApiData";
import { FUEL_OPTIONS, peso, formatDate, DIRECTION_STYLE } from "../../utils/format";

const RANGES = [
  { value: "4", label: "Last 4 weeks", weeks: 4 },
  { value: "8", label: "Last 8 weeks", weeks: 8 },
  { value: "12", label: "Last 12 weeks", weeks: 12 },
  { value: "all", label: "All time", weeks: null },
];

function SectionHeading({ id, icon: Icon, title, hint }) {
  return (
    <div className="mb-3 md:mb-4">
      <h2 id={id} className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {hint && <p className="text-xs md:text-sm text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function ForecastCard({ f }) {
  const style = DIRECTION_STYLE[f.direction];
  const headline =
    f.direction === "flat" ? "No change expected" : f.direction === "up" ? "Expected increase" : "Expected decrease";
  return (
    <article className="glass-card p-4 md:p-5" aria-label={`${f.fuel_type} forecast`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold">{f.fuel_type}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
          {headline}
        </span>
      </div>
      <p className={`mt-3 text-3xl font-black ${style.text}`}>
        <span aria-hidden="true">{style.arrow} </span>
        {f.direction === "flat" ? "₱0.00" : peso(Math.abs(f.change_per_liter))}
        <span className="text-base font-semibold text-slate-400">/L</span>
      </p>
      <p className="text-xs text-slate-400 mt-2">Outlook for the week of {formatDate(f.effective_date)}</p>
      <p className="text-xs text-slate-500 mt-0.5">Source: {f.source}</p>
      {f.notes && <p className="text-xs text-slate-400 mt-2">{f.notes}</p>}
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
      <p className="mt-2 text-3xl font-black text-white">
        {peso(m.current_avg)}
        <span className="text-base font-semibold text-slate-400">/L</span>
      </p>
      <p className="text-xs text-slate-500">Current average</p>
      <p className={`mt-2 text-sm font-semibold ${style.text}`}>
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <time dateTime={a.published_date} className="text-slate-400">{formatDate(a.published_date)}</time>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
          {a.source}
        </span>
        {a.fuel_type !== "All" && (
          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{a.fuel_type}</span>
        )}
      </div>
      <h3 className="text-white font-semibold mt-2">{a.title}</h3>
      <p className="text-sm text-slate-400 mt-1.5 whitespace-pre-line">{a.summary}</p>
      {a.source_url && (
        <a
          href={a.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline min-h-[44px] md:min-h-0
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
        >
          Read the full advisory <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
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

  const grid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
  const filterLabel = fuel === "All" ? "" : ` for ${fuel}`;

  return (
    <UserLayout
      title="Latest Updates & Price Trends"
      subtitle="Next-week outlook, weekly price movement and official energy advisories for Taguig City."
    >
      {/* Filters */}
      <form
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filters"
        className="glass-card p-4 mb-6 md:mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-xl"
      >
        <div>
          <label htmlFor="filter-fuel" className="label">Fuel type</label>
          <select id="filter-fuel" className="input-field min-h-[44px]" value={fuel} onChange={(e) => setFuel(e.target.value)}>
            <option value="All">All fuels</option>
            {[...FUEL_OPTIONS, "Kerosene"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-range" className="label">Date range</label>
          <select id="filter-range" className="input-field min-h-[44px]" value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </form>

      {/* Market forecast */}
      <section aria-labelledby="forecast-h" className="mb-8 md:mb-10">
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
      <section aria-labelledby="trends-h" className="mb-8 md:mb-10">
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
          <div className="grid gap-4"><LoadingBlock count={3} className="h-32" label="Loading advisories…" /></div>
        )}
        {advisories.error && <div className="grid"><ErrorBlock message={advisories.error} onRetry={advisories.reload} /></div>}
        {!advisories.loading && !advisories.error && advisories.data?.length === 0 && (
          <div className="grid"><EmptyBlock message={`No advisories${filterLabel} in this period.`} /></div>
        )}
        {!advisories.loading && advisories.data?.length > 0 && (
          <ul className="space-y-4">
            {advisories.data.map((a) => <AdvisoryItem key={a.advisory_id} a={a} />)}
          </ul>
        )}
      </section>
    </UserLayout>
  );
}
