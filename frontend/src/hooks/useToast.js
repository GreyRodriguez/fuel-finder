import { useCallback, useEffect, useRef, useState } from "react";

/** Temporary auto-dismissing status notice { message, tone } for admin actions. */
export default function useToast(durationMs = 3500) {
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((message, tone = "success") => {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, message: "" })), durationMs);
  }, [durationMs]);

  return { toast, show };
}
