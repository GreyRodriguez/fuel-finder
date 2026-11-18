import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const EVENT = "ff:feedback-changed";

/** Tell every mounted useFeedbackSummary() (nav badge, dashboard banner, tabs) to refetch. */
export function notifyFeedbackChanged() {
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Admin-only: feedback counts per status → { total, new, reviewed, resolved }.
 * Refetches on mount, when notifyFeedbackChanged() fires, and when the tab regains focus.
 */
export default function useFeedbackSummary() {
  const [summary, setSummary] = useState(null);

  const load = useCallback(() => {
    api.get("/api/admin/feedback/summary")
      .then((r) => setSummary(r.data))
      .catch(() => {}); // a missing badge is not worth an error message
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener(EVENT, load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(EVENT, load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { summary, reload: load };
}
