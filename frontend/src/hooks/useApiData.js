import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

/**
 * GET `path` with `params`, exposing { data, loading, error, reload }.
 * Re-fetches when `path` or the serialized `params` change; ignores out-of-date responses.
 */
export default function useApiData(path, params) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const reqId = useRef(0);
  const key = JSON.stringify(params ?? {});

  useEffect(() => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path, { params: JSON.parse(key) })
      .then((res) => { if (id === reqId.current) setState({ data: res.data, loading: false, error: null }); })
      .catch((err) => {
        if (id !== reqId.current) return;
        const detail = err.response?.data?.detail;
        setState({
          data: null,
          loading: false,
          error: typeof detail === "string" ? detail : "Couldn't load this data. Check your connection and try again.",
        });
      });
  }, [path, key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

