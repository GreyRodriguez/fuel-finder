import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

const MONTHS = [
  { index: 0, short: "Jan", name: "January", maxDays: 31 },
  { index: 1, short: "Feb", name: "February", maxDays: 29 },
  { index: 2, short: "Mar", name: "March", maxDays: 31 },
  { index: 3, short: "Apr", name: "April", maxDays: 30 },
  { index: 4, short: "May", name: "May", maxDays: 31 },
  { index: 5, short: "June", name: "June", maxDays: 30 },
  { index: 6, short: "Jul", name: "July", maxDays: 31 },
  { index: 7, short: "Aug", name: "August", maxDays: 31 },
  { index: 8, short: "Sep", name: "September", maxDays: 30 },
  { index: 9, short: "Oct", name: "October", maxDays: 31 },
  { index: 10, short: "Nov", name: "November", maxDays: 30 },
  { index: 11, short: "Dec", name: "December", maxDays: 31 },
];

const YEARS_PER_PAGE = 16;

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Parse "YYYY-MM-DD" into { year, month (0-11), day (1-31) } or null. */
function parseIsoDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Format "YYYY-MM-DD" as "MM/DD/YYYY" for compact pill display. */
function formatMmDdYyyy(iso) {
  const p = parseIsoDate(iso);
  if (!p) return "";
  return `${pad2(p.month + 1)}/${pad2(p.day)}/${p.year}`;
}

function defaultYearPageStart(anchorYear) {
  const base = anchorYear ?? new Date().getFullYear();
  return base - 11;
}

/**
 * Reusable Multi-view Drill-down Tile Date Picker (Month -> Day -> Year).
 *
 * Props:
 *  - value: ISO string "YYYY-MM-DD" or null/""
 *  - onChange: (isoDateOrNull) => void
 *  - placeholder: label when no date is selected (default: "All Dates")
 *  - resetLabel: label for the quick reset button inside the popover (default: "All Dates")
 *  - align: preferred horizontal popover anchor ("right" | "left", default: "right")
 *  - ariaLabel: accessible label for the trigger button
 *  - className: optional wrapper className
 */
export default function TileDatePicker({
  value = null,
  onChange,
  placeholder = "All Dates",
  resetLabel = "All Dates",
  align = "right",
  ariaLabel = "Filter by date",
  className = "",
}) {
  const dialogId = useId();
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const parsedValue = useMemo(() => parseIsoDate(value), [value]);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("month"); // "month" | "day" | "year"
  const [draftMonth, setDraftMonth] = useState(null);
  const [draftDay, setDraftDay] = useState(null);
  const [yearPageStart, setYearPageStart] = useState(() => defaultYearPageStart());
  const [popoverAlign, setPopoverAlign] = useState(align); // "right" | "left" | "center"

  // Close on outside click or Escape key
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const computeAlignment = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect || typeof window === "undefined") return align;
    const panelW = Math.min(312, window.innerWidth - 24);
    const fitsRightAnchored = rect.right >= panelW + 12;
    const fitsLeftAnchored = window.innerWidth - rect.left >= panelW + 12;

    if (align === "right") {
      if (fitsRightAnchored) return "right";
      if (fitsLeftAnchored) return "left";
      return "center";
    }
    if (fitsLeftAnchored) return "left";
    if (fitsRightAnchored) return "right";
    return "center";
  };

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setStep("month");
    setDraftMonth(parsedValue?.month ?? null);
    setDraftDay(parsedValue?.day ?? null);
    setYearPageStart(defaultYearPageStart(parsedValue?.year));
    setPopoverAlign(computeAlignment());
    setOpen(true);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.(null);
    setOpen(false);
  };

  const handleSelectMonth = (monthIndex) => {
    setDraftMonth(monthIndex);
    // If switching to a month with fewer days than previously drafted day, clear draftDay
    const maxDays = MONTHS[monthIndex].maxDays;
    setDraftDay((prev) => (prev && prev <= maxDays ? prev : null));
    setStep("day");
  };

  const handleSelectDay = (day) => {
    setDraftDay(day);
    setYearPageStart(defaultYearPageStart(parsedValue?.year));
    setStep("year");
  };

  const handleSelectYear = (year) => {
    if (draftMonth == null || draftDay == null) return;
    if (draftMonth === 1 && draftDay === 29 && !isLeapYear(year)) return;
    const iso = `${year}-${pad2(draftMonth + 1)}-${pad2(draftDay)}`;
    onChange?.(iso);
    setOpen(false);
  };

  const handleBack = () => {
    if (step === "year") setStep("day");
    else if (step === "day") setStep("month");
  };

  const selectedMonthMeta = draftMonth != null ? MONTHS[draftMonth] : null;
  const isFeb29 = draftMonth === 1 && draftDay === 29;
  const currentYear = new Date().getFullYear();

  const days = useMemo(() => {
    const count = selectedMonthMeta?.maxDays ?? 31;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selectedMonthMeta]);

  const years = useMemo(
    () => Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i),
    [yearPageStart],
  );

  const alignClass =
    popoverAlign === "right"
      ? "right-0"
      : popoverAlign === "left"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";

  const displayLabel = value ? formatMmDdYyyy(value) : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Trigger Pill */}
      <div
        className={`inline-flex items-center rounded-xl border transition-all duration-200 ${
          value || open
            ? "bg-slate-900 border-orange-500/50 text-white shadow-[0_0_0_1px_rgba(249,115,22,0.18)]"
            : "bg-slate-900/90 border-white/10 text-slate-200 hover:border-white/20 hover:text-white"
        }`}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          className="inline-flex items-center gap-2 min-h-11 px-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 rounded-xl"
        >
          <Calendar
            className={`w-4 h-4 flex-shrink-0 ${value || open ? "text-orange-400" : "text-slate-400"}`}
            aria-hidden="true"
          />
          <span className="tabular-nums">{displayLabel}</span>
          {!value && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-orange-400" : ""}`}
              aria-hidden="true"
            />
          )}
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear selected date"
            title="Clear date filter"
            className="min-h-11 w-9 -ml-1 mr-0.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Floating Drill-Down Popover */}
      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="Select date"
          className={`absolute top-full mt-2 z-50 ${alignClass} w-[min(19.5rem,calc(100vw-1.5rem))] rounded-2xl bg-[#111520] border border-white/12 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.85)] overflow-hidden`}
        >
          {/* Header: Back + Live Breadcrumb */}
          <div className="px-3.5 py-3 border-b border-white/[0.08] bg-[#0D1018] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {step !== "month" && (
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label={step === "year" ? "Back to day selection" : "Back to month selection"}
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white inline-flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              )}

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  {step === "month" ? "Step 1 of 3 · Month" : step === "day" ? "Step 2 of 3 · Day" : "Step 3 of 3 · Year"}
                </p>
                <p className="text-sm font-bold text-white truncate">
                  {step === "month" && "Choose a month"}
                  {step === "day" && (
                    <>
                      <span className="text-orange-400">{selectedMonthMeta?.short}</span>
                      <span className="text-slate-500 font-normal"> · Pick day</span>
                    </>
                  )}
                  {step === "year" && (
                    <>
                      <span className="text-orange-400">
                        {selectedMonthMeta?.short} {draftDay}
                      </span>
                      <span className="text-slate-500 font-normal"> · Pick year</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Year pagination controls */}
            {step === "year" && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setYearPageStart((y) => y - YEARS_PER_PAGE)}
                  aria-label="Previous years"
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setYearPageStart((y) => y + YEARS_PER_PAGE)}
                  aria-label="Next years"
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Step Body */}
          <div className="p-3.5">
            {/* Step 1: 3x4 Month Tile Grid */}
            {step === "month" && (
              <div role="grid" aria-label="Months" className="grid grid-cols-3 gap-2">
                {MONTHS.map((m) => {
                  const isCurrentSelected = parsedValue?.month === m.index;
                  return (
                    <button
                      key={m.short}
                      type="button"
                      onClick={() => handleSelectMonth(m.index)}
                      className={`h-11 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer ${
                        isCurrentSelected
                          ? "bg-orange-500/20 border-orange-500/60 text-orange-300"
                          : "bg-slate-800/70 border-white/[0.07] text-slate-200 hover:bg-slate-700/80 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {m.short}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Day Tile Grid (1 to 29/30/31) */}
            {step === "day" && (
              <div role="grid" aria-label={`Days in ${selectedMonthMeta?.name}`} className="grid grid-cols-7 gap-1.5">
                {days.map((d) => {
                  const isCurrentSelected =
                    parsedValue?.month === draftMonth && parsedValue?.day === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={`h-9 rounded-lg text-xs sm:text-sm font-semibold tabular-nums border transition-all duration-150 cursor-pointer ${
                        isCurrentSelected
                          ? "bg-orange-500/20 border-orange-500/60 text-orange-300"
                          : "bg-slate-800/70 border-white/[0.06] text-slate-200 hover:bg-orange-500 hover:border-orange-400 hover:text-zinc-950"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: 4x4 Year Tile Grid */}
            {step === "year" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 tabular-nums">
                  <span>
                    {yearPageStart} – {yearPageStart + YEARS_PER_PAGE - 1}
                  </span>
                  {isFeb29 && <span className="text-amber-400 font-medium">Leap years only</span>}
                </div>

                <div role="grid" aria-label="Years" className="grid grid-cols-4 gap-2">
                  {years.map((y) => {
                    const invalidLeap = isFeb29 && !isLeapYear(y);
                    const isCurrentSelected =
                      parsedValue?.year === y &&
                      parsedValue?.month === draftMonth &&
                      parsedValue?.day === draftDay;
                    const isThisYear = y === currentYear;

                    return (
                      <button
                        key={y}
                        type="button"
                        disabled={invalidLeap}
                        title={invalidLeap ? `${y} is not a leap year (no Feb 29)` : undefined}
                        onClick={() => handleSelectYear(y)}
                        className={`h-10 rounded-xl text-xs sm:text-sm font-semibold tabular-nums border transition-all duration-150 ${
                          invalidLeap
                            ? "bg-slate-900/40 border-white/[0.04] text-slate-600 cursor-not-allowed line-through"
                            : isCurrentSelected
                              ? "bg-orange-500 border-orange-400 text-zinc-950 cursor-pointer"
                              : isThisYear
                                ? "bg-slate-800/90 border-orange-500/40 text-orange-300 hover:bg-orange-500 hover:text-zinc-950 cursor-pointer"
                                : "bg-slate-800/70 border-white/[0.07] text-slate-200 hover:bg-orange-500 hover:border-orange-400 hover:text-zinc-950 cursor-pointer"
                        }`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer: Breadcrumb step tabs + Reset */}
          <div className="px-3.5 py-2.5 border-t border-white/[0.08] bg-[#0D1018]/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <button
                type="button"
                onClick={() => setStep("month")}
                className={`px-1.5 py-1 rounded transition-colors cursor-pointer ${
                  step === "month" ? "text-orange-400 font-semibold" : "hover:text-slate-200"
                }`}
              >
                {selectedMonthMeta ? selectedMonthMeta.short : "Mon"}
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                disabled={draftMonth == null}
                onClick={() => draftMonth != null && setStep("day")}
                className={`px-1.5 py-1 rounded transition-colors ${
                  draftMonth == null
                    ? "opacity-40 cursor-not-allowed"
                    : step === "day"
                      ? "text-orange-400 font-semibold cursor-pointer"
                      : "hover:text-slate-200 cursor-pointer"
                }`}
              >
                {draftDay != null ? pad2(draftDay) : "Day"}
              </button>
              <span aria-hidden="true">/</span>
              <span className={step === "year" ? "px-1.5 py-1 text-orange-400 font-semibold" : "px-1.5 py-1"}>
                {parsedValue && step === "month" ? parsedValue.year : "Year"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium transition-colors cursor-pointer"
            >
              {resetLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
