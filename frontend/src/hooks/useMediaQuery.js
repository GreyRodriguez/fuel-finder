import { useEffect, useState } from "react";

/** Breakpoint shared with Tailwind's `md:` prefix (768px). Below this = mobile layout. */
export const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Subscribe to a CSS media query and re-render when it starts/stops matching.
 * @param {string} query e.g. "(max-width: 767px)"
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
