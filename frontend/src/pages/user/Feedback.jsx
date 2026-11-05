import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import UserLayout from "../../components/UserLayout";
import StationCombobox from "../../components/StationCombobox";
import { Spinner } from "../../components/DataStates";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { FUEL_OPTIONS } from "../../utils/format";

const CATEGORIES = ["System Needs", "Suggestion", "Price Report", "Other"];
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
  return <p id={id} role="alert" className="text-danger text-xs mt-1.5">{message}</p>;
}

export default function Feedback() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState("");
  const submittingRef = useRef(false); // synchronous guard against double submits
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

  // Load the station list the first time "Price Report" is chosen
  useEffect(() => {
    if (isPriceReport && stationsState === "idle") loadStations();
  }, [isPriceReport, stationsState]);

  // Move focus to the success / error banner so screen-reader users hear the result
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
      // focus the first invalid field
      const first = ["name", "email", "message", "station_id", "fuel_type", "reported_price"].find((k) => found[k]);
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
      subtitle="Spotted a wrong price or have an idea? Tell us — it helps keep FuelFinder accurate."
      maxWidth="max-w-2xl"
    >
      {status === "success" && (
        <div ref={bannerRef} tabIndex={-1} role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success outline-none">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>Thank you! Your feedback was sent. You can send another below.</p>
        </div>
      )}
      {status === "error" && (
        <div ref={bannerRef} tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger outline-none">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1">{serverError}</p>
          </div>
          <button
            type="button"
            onClick={() => lastPayload.current && send(lastPayload.current)}
            className="btn-secondary text-sm mt-3 min-h-[44px] px-4"
          >
            Retry sending
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="glass-card p-4 md:p-6 space-y-5" aria-busy={submitting}>
        {user && (
          <p className="text-xs text-slate-400">
            Signed in as <span className="text-slate-200">{user.full_name}</span> — your feedback will be linked to your account.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fb-name" className="label">Name <span className="text-slate-500">(optional)</span></label>
            <input id="fb-name" className="input-field min-h-[44px]" autoComplete="name" maxLength={100}
              value={form.name} onChange={set("name")} aria-invalid={!!errors.name || undefined} aria-describedby={describe("name")} />
            <FieldError id="fb-name-err" message={errors.name} />
          </div>
          <div>
            <label htmlFor="fb-email" className="label">Email <span className="text-slate-500">(optional)</span></label>
            <input id="fb-email" type="email" className="input-field min-h-[44px]" autoComplete="email" inputMode="email" maxLength={150}
              value={form.email} onChange={set("email")} aria-invalid={!!errors.email || undefined} aria-describedby={describe("email")} />
            <FieldError id="fb-email-err" message={errors.email} />
          </div>
        </div>

        <div>
          <label htmlFor="fb-category" className="label">Category</label>
          <select id="fb-category" className="input-field min-h-[44px]" value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {isPriceReport && (
          <fieldset className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
            <legend className="px-2 text-sm font-semibold text-primary">Price report details</legend>

            <div>
              <label htmlFor="fb-station_id" className="label">Station</label>
              {stationsState === "error" ? (
                <div className="flex items-center gap-3 text-sm text-danger" role="alert">
                  Couldn't load stations.
                  <button type="button" onClick={loadStations} className="btn-secondary text-sm min-h-[44px] px-4">Retry</button>
                </div>
              ) : stationsState === "loading" || stationsState === "idle" ? (
                <p className="text-sm text-slate-400 flex items-center gap-2" role="status"><Spinner /> Loading stations…</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fb-fuel_type" className="label">Fuel type</label>
                <select id="fb-fuel_type" className="input-field min-h-[44px]" value={form.fuel_type} onChange={set("fuel_type")}
                  aria-invalid={!!errors.fuel_type || undefined} aria-describedby={describe("fuel_type")}>
                  <option value="">Select fuel type</option>
                  {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <FieldError id="fb-fuel_type-err" message={errors.fuel_type} />
              </div>
              <div>
                <label htmlFor="fb-reported_price" className="label">Reported price (₱ per liter)</label>
                <input id="fb-reported_price" type="number" inputMode="decimal" step="0.01" min="0" max="999.99" placeholder="e.g. 62.50"
                  className="input-field min-h-[44px]" value={form.reported_price} onChange={set("reported_price")}
                  aria-invalid={!!errors.reported_price || undefined} aria-describedby={describe("reported_price")} />
                <FieldError id="fb-reported_price-err" message={errors.reported_price} />
              </div>
            </div>
          </fieldset>
        )}

        <div>
          <label htmlFor="fb-message" className="label">Message</label>
          <textarea id="fb-message" rows={6} maxLength={MAX_MESSAGE} className="input-field resize-y min-h-[140px]"
            placeholder="Tell us what's on your mind…"
            value={form.message} onChange={set("message")}
            aria-invalid={!!errors.message || undefined} aria-describedby={describe("message", "fb-message-count")} />
          <div className="flex justify-between gap-3 mt-1.5">
            <FieldError id="fb-message-err" message={errors.message} />
            <p id="fb-message-count" className={`ml-auto text-xs ${msgLen >= MAX_MESSAGE ? "text-danger" : msgLen > 900 ? "text-warning" : "text-slate-500"}`}>
              {msgLen}/{MAX_MESSAGE}
            </p>
          </div>
        </div>

        {/* Honeypot: invisible to people, tempting to bots. Must stay empty. */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor="fb-website">Leave this field empty</label>
          <input id="fb-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto min-h-[48px] px-8 gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting ? (<><Spinner /> Sending…</>) : "Send feedback"}
        </button>
      </form>
    </UserLayout>
  );
}

