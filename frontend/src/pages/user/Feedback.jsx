import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Lightbulb, Fuel, Wrench, MessageCircle, Send } from "lucide-react";
import UserLayout from "../../components/UserLayout";
import StationCombobox from "../../components/StationCombobox";
import { Spinner } from "../../components/DataStates";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { FUEL_OPTIONS } from "../../utils/format";

const CATEGORIES = [
  { id: "Suggestion", label: "Suggestion", icon: Lightbulb },
  { id: "Price Report", label: "Price Report", icon: Fuel },
  { id: "System Needs", label: "System Issue", icon: Wrench },
  { id: "Other", label: "Other", icon: MessageCircle },
];
const MAX_MESSAGE = 1000;
const MIN_MESSAGE = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  name: "", email: "", category: "Suggestion", message: "",
  station_id: "", fuel_type: "", reported_price: "", website: "",
};

function validate(f) {
  const e = {};
  if (f.name.trim().length > 100) e.name = "Name must be 100 characters or fewer.";
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address, or leave it blank.";
  const len = f.message.trim().length;
  if (len < MIN_MESSAGE) e.message = `Message must be at least ${MIN_MESSAGE} characters (${len}/${MIN_MESSAGE}).`;
  else if (len > MAX_MESSAGE) e.message = `Message must be ${MAX_MESSAGE} characters or fewer.`;
  if (f.category === "Price Report") {
    if (!f.station_id) e.station_id = "Choose the station you are reporting.";
    if (!f.fuel_type) e.fuel_type = "Choose a fuel type.";
    const price = Number(f.reported_price);
    if (f.reported_price === "" || Number.isNaN(price) || price <= 0) e.reported_price = "Enter the price you saw, e.g. 62.50.";
    else if (price >= 1000) e.reported_price = "That price looks too high.";
  }
  return e;
}

function buildPayload(f) {
  const base = {
    name: f.name.trim() || null,
    email: f.email.trim() || null,
    category: f.category,
    message: f.message.trim(),
    website: f.website,
  };
  if (f.category !== "Price Report") return base;
  return { ...base, station_id: Number(f.station_id), fuel_type: f.fuel_type, reported_price: Number(f.reported_price) };
}

/** Turn FastAPI's 422 detail array into { field: message }. */
function serverFieldErrors(detail) {
  if (!Array.isArray(detail)) return {};
  const out = {};
  for (const d of detail) {
    const field = d.loc?.[d.loc.length - 1];
    if (typeof field === "string" && field !== "body" && !out[field]) out[field] = (d.msg || "Invalid value").replace(/^Value error, /, "");
  }
  return out;
}

function FieldError({ id, message }) {
  if (!message) return null;
  return <p id={id} role="alert" className="text-rose-400 text-xs mt-1.5">{message}</p>;
}

export default function Feedback() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState(() => {
    const cat = CATEGORIES.some((c) => c.id === params.get("category")) ? params.get("category") : "Suggestion";
    const sid = Number.parseInt(params.get("station_id") || "", 10);
    return { ...EMPTY, category: cat, station_id: Number.isNaN(sid) ? "" : sid };
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState("");
  const submittingRef = useRef(false);
  const bannerRef = useRef(null);
  const lastPayload = useRef(null);

  const [stations, setStations] = useState([]);
  const [stationsState, setStationsState] = useState("idle"); // idle | loading | ready | error
  const isPriceReport = form.category === "Price Report";

  const loadStations = () => {
    setStationsState("loading");
    api.get("/api/stations/")
      .then((r) => { setStations(r.data); setStationsState("ready"); })
      .catch(() => setStationsState("error"));
  };

  useEffect(() => {
    if (isPriceReport && stationsState === "idle") loadStations();
  }, [isPriceReport, stationsState]);

  useEffect(() => {
    if (status === "success" || status === "error") bannerRef.current?.focus();
  }, [status]);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    if (status === "success") setStatus("idle");
  };

  const send = async (payload) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus("submitting");
    setServerError("");
    try {
      await api.post("/api/feedback/", payload);
      setForm(EMPTY);
      setErrors({});
      lastPayload.current = null;
      setStatus("success");
    } catch (err) {
      const res = err.response;
      if (res?.status === 422) {
        const fieldErrs = serverFieldErrors(res.data?.detail);
        if (Object.keys(fieldErrs).length) { setErrors(fieldErrs); setStatus("idle"); return; }
        setServerError(typeof res.data?.detail === "string" ? res.data.detail : "Some fields are invalid.");
      } else if (res?.status === 429) {
        setServerError(res.data?.detail || "You're sending feedback too quickly. Please wait a few minutes.");
      } else if (!res) {
        setServerError("Couldn't reach the server. Check your connection and try again.");
      } else {
        setServerError(typeof res.data?.detail === "string" ? res.data.detail : "Something went wrong. Please try again.");
      }
      lastPayload.current = payload;
      setStatus("error");
    } finally {
      submittingRef.current = false;
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = ["name", "email", "station_id", "fuel_type", "reported_price", "message"].find((k) => found[k]);
      document.getElementById(`fb-${first}`)?.focus();
      return;
    }
    send(buildPayload(form));
  };

  const submitting = status === "submitting";
  const msgLen = form.message.length;
  const describe = (f, extra) => [errors[f] ? `fb-${f}-err` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <UserLayout
      title="Feedback"
      subtitle="Spotted a wrong pump price or have an idea? Tell us — your reports keep Taguig prices accurate."
      maxWidth="max-w-2xl"
    >
      {status === "success" && (
        <div ref={bannerRef} tabIndex={-1} role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-300 outline-none">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>Thank you! Your feedback was sent. You can send another below.</p>
        </div>
      )}
      {status === "error" && (
        <div ref={bannerRef} tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-sm text-rose-300 outline-none">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1">{serverError}</p>
          </div>
          <button
            type="button"
            onClick={() => lastPayload.current && send(lastPayload.current)}
            className="btn-secondary text-xs min-h-11 mt-3 px-4"
          >
            Retry sending
          </button>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-2xl bg-[#111520] border border-white/[0.07] p-5 sm:p-7 space-y-5"
        aria-busy={submitting}
      >
        {user && (
          <p className="text-xs sm:text-sm text-[#94A3B8] pb-4 border-b border-white/[0.06]">
            Signed in as <span className="text-[#F8FAFC] font-medium">{user.full_name}</span> — your feedback will be linked to your account.
          </p>
        )}

        <div>
          <span className="label mb-2">Category</span>
          <div role="radiogroup" aria-label="Feedback category" className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const active = form.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setForm((f) => ({ ...f, category: c.id }));
                    if (status === "success") setStatus("idle");
                  }}
                  className={`min-h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-orange-500/15 border-orange-500/50 text-[#F8FAFC] font-semibold"
                      : "bg-[#0D1018] border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/[0.16]"
                  }`}
                >
                  <c.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-orange-400" : "text-slate-500"}`} aria-hidden="true" />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapses to single vertical stack below 768px (md:) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label htmlFor="fb-name" className="label">Name <span className="text-slate-500">(optional)</span></label>
            <input id="fb-name" className="input-field min-h-11" autoComplete="name" maxLength={100}
              value={form.name} onChange={set("name")} aria-invalid={!!errors.name || undefined} aria-describedby={describe("name")} />
            <FieldError id="fb-name-err" message={errors.name} />
          </div>
          <div className="min-w-0">
            <label htmlFor="fb-email" className="label">Email <span className="text-slate-500">(optional)</span></label>
            <input id="fb-email" type="email" className="input-field min-h-11" autoComplete="email" inputMode="email" maxLength={150}
              value={form.email} onChange={set("email")} aria-invalid={!!errors.email || undefined} aria-describedby={describe("email")} />
            <FieldError id="fb-email-err" message={errors.email} />
          </div>
        </div>

        {isPriceReport && (
          <fieldset className="rounded-xl border border-orange-500/25 bg-orange-500/[0.04] p-4 sm:p-5 space-y-4">
            <legend className="px-2 text-xs sm:text-sm font-semibold text-orange-400">Price report details</legend>

            <div>
              <label htmlFor="fb-station_id" className="label">Station</label>
              {stationsState === "error" ? (
                <div className="flex items-center gap-3 text-sm text-rose-400" role="alert">
                  Couldn't load stations.
                  <button type="button" onClick={loadStations} className="btn-secondary text-xs min-h-11 px-3.5">Retry</button>
                </div>
              ) : stationsState === "loading" || stationsState === "idle" ? (
                <p className="text-sm text-[#94A3B8] flex items-center gap-2" role="status"><Spinner /> Loading stations…</p>
              ) : (
                <StationCombobox
                  id="fb-station_id"
                  stations={stations}
                  value={form.station_id}
                  onChange={(id) => { setForm((f) => ({ ...f, station_id: id })); setErrors((er) => ({ ...er, station_id: undefined })); }}
                  invalid={!!errors.station_id}
                  describedBy={describe("station_id")}
                />
              )}
              <FieldError id="fb-station_id-err" message={errors.station_id} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label htmlFor="fb-fuel_type" className="label">Fuel type</label>
                <select id="fb-fuel_type" className="input-field min-h-11" value={form.fuel_type} onChange={set("fuel_type")}
                  aria-invalid={!!errors.fuel_type || undefined} aria-describedby={describe("fuel_type")}>
                  <option value="">Select fuel type</option>
                  {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <FieldError id="fb-fuel_type-err" message={errors.fuel_type} />
              </div>
              <div className="min-w-0">
                <label htmlFor="fb-reported_price" className="label">Reported price (₱/L)</label>
                <input id="fb-reported_price" type="number" inputMode="decimal" step="0.01" min="0" max="999.99" placeholder="e.g. 68.93"
                  className="input-field min-h-11" value={form.reported_price} onChange={set("reported_price")}
                  aria-invalid={!!errors.reported_price || undefined} aria-describedby={describe("reported_price")} />
                <FieldError id="fb-reported_price-err" message={errors.reported_price} />
              </div>
            </div>
          </fieldset>
        )}

        <div>
          <label htmlFor="fb-message" className="label">Message</label>
          <textarea id="fb-message" rows={5} maxLength={MAX_MESSAGE} className="input-field resize-y min-h-[128px]"
            placeholder="Tell us what's on your mind…"
            value={form.message} onChange={set("message")}
            aria-invalid={!!errors.message || undefined} aria-describedby={describe("message", "fb-message-count")} />
          <div className="flex justify-between gap-3 mt-1.5">
            <FieldError id="fb-message-err" message={errors.message} />
            <p id="fb-message-count" className={`ml-auto text-xs tabular-nums ${msgLen >= MAX_MESSAGE ? "text-rose-400" : msgLen > 900 ? "text-amber-400" : "text-slate-500"}`}>
              {msgLen}/{MAX_MESSAGE}
            </p>
          </div>
        </div>

        {/* Honeypot: invisible to people, tempting to bots. Must stay empty. */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor="fb-website">Leave this field empty</label>
          <input id="fb-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 min-h-11 w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (<><Spinner /> Sending…</>) : <><Send className="w-4 h-4" aria-hidden="true" /> Send feedback</>}
        </button>
      </form>
    </UserLayout>
  );
}
