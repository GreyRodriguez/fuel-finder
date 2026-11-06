import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const label = (s) => `${s.name}${s.brand && !s.name.toLowerCase().includes(s.brand.toLowerCase()) ? ` (${s.brand})` : ""}`;

/**
 * Searchable station dropdown (ARIA combobox pattern).
 * Props: stations [{station_id, name, brand, barangay}], value (station_id | ""), onChange(id | ""),
 *        id, invalid, describedBy, disabled.
 */
export default function StationCombobox({ stations, value, onChange, id, invalid = false, describedBy, disabled = false }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = useMemo(() => stations.find((s) => s.station_id === value), [stations, value]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? stations.filter((s) => `${s.name} ${s.brand ?? ""} ${s.barangay ?? ""} ${s.address ?? ""}`.toLowerCase().includes(q))
      : stations;
    return list.slice(0, 50);
  }, [stations, query]);

  // Close on outside tap/click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the highlighted option scrolled into view
  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, uid]);

  const choose = (s) => {
    onChange(s.station_id);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${uid}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        disabled={disabled}
        placeholder="Search for a station…"
        className="input-field pr-10 min-h-[44px]"
        value={open ? query : selected ? label(selected) : ""}
        onFocus={() => { setOpen(true); setActive(0); }}
        onClick={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); if (value) onChange(""); }}
        onKeyDown={onKeyDown}
      />
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Stations"
          className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto overscroll-contain rounded-xl bg-dark-700 border border-white/10 shadow-2xl py-1"
        >
          {options.length === 0 && <li className="px-4 py-3 text-sm text-slate-400" role="presentation">No stations match “{query}”.</li>}
          {options.map((s, i) => (
            <li
              key={s.station_id}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={s.station_id === value}
              onPointerDown={(e) => e.preventDefault() /* keep focus in the input */}
              onClick={() => choose(s)}
              onMouseEnter={() => setActive(i)}
              className={`min-h-[44px] px-4 py-2 cursor-pointer flex flex-col justify-center text-sm ${
                i === active ? "bg-primary/15 text-white" : "text-slate-300"
              } ${s.station_id === value ? "font-semibold" : ""}`}
            >
              <span>{label(s)}</span>
              {s.barangay && <span className="text-xs text-slate-500">{s.barangay}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

