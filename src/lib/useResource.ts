import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./api";

/** Loads a GET endpoint with loading/error state and a reload function. */
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(!!path);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const n = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const d = await api.get<T>(path);
      if (n === seq.current) setData(d);
    } catch (e) {
      if (n === seq.current) setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong."));
    } finally {
      if (n === seq.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
