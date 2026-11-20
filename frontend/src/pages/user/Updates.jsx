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
    <div className="mb-4 md:mb-5">
      <h2 id={id} className="text-lg sm:text-xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2">
        <Icon className="w-4 h-4 text-orange-400 flex-shrink-0" aria-hidden="true" />
        {title}
      </h2>
      {hint && <p className="text-sm text-[#94A3B8] mt-1">{hint}</p>}
    </div>
  );
}

function ForecastCard({ f }) {
  const style = DIRECTION_STYLE[f.direction];
  const headline =
    f.direction === "flat" ? "No change" : f.direction === "up" ? "Expected hike" : "Expected rollback";
  return (
    <article
      className="rounded-2xl bg-[#111520] border border-white/[0.07] hover:border-white/[0.12] transition-all duration-200 p-5"
      aria-label={`${f.fuel_type} forecast`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[#F8FAFC] font-semibold text-base">{f.fuel_type}</h3>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
          {headline}
        </span>
      </div>
      <p className={`mt-3.5 text-3xl font-extrabold tracking-tight tabular-nums ${style.text}`}>
        <span aria-hidden="true">{style.arrow} </span>
        {f.direction === "flat" ? "₱0.00" : peso(Math.abs(f.change_per_liter))}
        <span className="text-sm font-medium text-[#94A3B8]">/L</span>
      </p>
      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-0.5 text-xs">
        <p className="text-[#94A3B8]">Week of {formatDate(f.effective_date)}</p>
        <p className="text-slate-500">Source: {f.source}</p>
        {f.notes && <p className="text-[#94A3B8] pt-1.5 leading-relaxed">{f.notes}</p>}
      </div>
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
    <article
      className="rounded-2xl bg-[#111520] border border-white/[0.07] hover:border-white/[0.12] transition-all duration-200 p-5"
      aria-label={`${m.fuel_type} price trend`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[#F8FAFC] font-semibold text-base">{m.fuel_type}</h3>
        <span className="text-xs text-slate-500 tabular-nums">{m.station_count} stations</span>
      </div>
      <p className="mt-2.5 text-3xl font-extrabold tracking-tight text-[#F8FAFC] tabular-nums">
        {peso(m.current_avg)}
        <span className="text-sm font-medium text-[#94A3B8]">/L</span>
      </p>
      <p className="text-xs text-slate-500 mt-0.5">Current Taguig average</p>
      <p className={`mt-2.5 text-sm font-semibold ${style.text}`}>
        {m.change != null && <span aria-hidden="true">{style.arrow} </span>}
        <span className="sr-only">
          {m.direction === "down" ? "Down " : m.direction === "up" ? "Up " : ""}
        </span>
        {changeText}
      </p>
      <div className="mt-4">
        <Sparkline data={m.series} stroke={style.stroke} label={`${m.fuel_type} weekly average`} />
        {weeks >= 2 && (
          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
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
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
        <time dateTime={a.published_date} className="text-[#94A3B8]">{formatDate(a.published_date)}</time>
        <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
          {a.source}
        </span>
        {a.fuel_type !== "All" && (
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {a.fuel_type}
          </span>
        )}
      </div>
      <h3 className="text-[#F8FAFC] font-semibold mt-2 text-base leading-snug">{a.title}</h3>
      <p className="text-sm text-[#94A3B8] mt-1.5 whitespace-pre-line leading-relaxed">{a.summary}</p>
      {a.source_url && (
        <a
          href={a.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-orange-400 hover:text-orange-300
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 rounded-lg transition-colors"
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

  const grid = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
  const filterLabel = fuel === "All" ? "" : ` for ${fuel}`;

  return (
    <UserLayout
      title="Updates & Price Trends"
      subtitle="Next-week outlook, weekly Taguig price movement, and official DOE energy advisories."
    >
      {/* Mobile-friendly pill filters — ≥44px tap targets, zero horizontal overflow */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-7 md:mb-10">
        <div
          role="group"
          aria-label="Filter by fuel type"
          className="grid grid-cols-2 min-[380px]:grid-cols-3 md:flex md:flex-wrap gap-2"
        >
          {FUEL_TABS.map((f) => {
            const active = fuel === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFuel(f)}
                className={`min-h-11 px-3.5 rounded-full border text-sm font-medium whitespace-nowrap text-center truncate transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-[#F8FAFC] text-[#090B10] border-[#F8FAFC] font-semibold"
                    : "bg-[#111520] text-[#94A3B8] border-white/[0.08] hover:text-[#F8FAFC] hover:border-white/[0.16]"
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
          className="grid grid-cols-4 md:inline-grid w-full md:w-auto gap-1 p-1 rounded-xl bg-[#111520] border border-white/[0.07] flex-shrink-0"
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={range === r.value}
              aria-label={r.fullLabel}
              onClick={() => setRange(r.value)}
              className={`min-h-10 px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                range === r.value
                  ? "bg-white/[0.1] text-[#F8FAFC]"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Market forecast */}
      <section aria-labelledby="forecast-h" className="mb-10 md:mb-12">
        <SectionHeading
          id="forecast-h"
          icon={TrendingUp}
          title="Next-week market forecast"
          hint="Expected pump price movement for next week (₱ per liter)."
        />
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
      <section aria-labelledby="trends-h" className="mb-10 md:mb-12">
        <SectionHeading
          id="trends-h"
          icon={TrendingUp}
          title="Fuel price changes"
          hint="Average pump price across Taguig stations, compared with last week."
        />
        <div className={grid}>
          {trends.loading && <LoadingBlock count={3} className="h-64" label="Loading price trends…" />}
          {trends.error && <ErrorBlock message={trends.error} onRetry={trends.reload} />}
          {!trends.loading && !trends.error && trends.data?.length === 0 && (
            <EmptyBlock message={`No pump-price trend is tracked${filterLabel}.`} />
          )}
          {!trends.loading && trends.data?.map((m) => <MetricCard key={m.fuel_type} m={m} />)}
        </div>
      </section>

      {/* Advisories — clean editorial divided feed instead of stacked boxes */}
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
          <div className="rounded-2xl bg-[#111520] border border-white/[0.07] px-5 sm:px-7 py-5 sm:py-6">
            <ul className="divide-y divide-white/[0.06]">
              {advisories.data.map((a) => <AdvisoryItem key={a.advisory_id} a={a} />)}
            </ul>
          </div>
        )}
      </section>
    </UserLayout>
  );
}
