import { useCallback, useEffect, useRef } from "react";

export type SaveStatus = "idle" | "local" | "dirty" | "saving" | "saved" | "error";

/**
 * Debounced, ordered saving of a value. Only saves when the value really changed, never runs two saves at
 * once, reports dirty / saving / saved / error, and saves anything still pending when the component goes away.
 * `flush` saves immediately and resolves to whether it worked; `baseline` is what the server already has.
 */
export function useAutosave<T>(value: T, save: (v: T) => Promise<void>, opts: { enabled?: boolean; delay?: number; baseline?: T; onStatus?: (s: SaveStatus, retry?: () => void) => void } = {}) {
  const { enabled = true, delay = 900 } = opts;
  const key = JSON.stringify(value);
  const lastKey = useRef(JSON.stringify(opts.baseline !== undefined ? opts.baseline : value));
  const latest = useRef({ value, save, enabled, onStatus: opts.onStatus });
  latest.current = { value, save, enabled, onStatus: opts.onStatus };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<boolean>>(Promise.resolve(true));

  const flush = useCallback((): Promise<boolean> => {
    clearTimeout(timer.current);
    const { value: v, enabled: on } = latest.current;
    const k = JSON.stringify(v);
    if (!on || k === lastKey.current) return chain.current;
    lastKey.current = k;
    latest.current.onStatus?.("saving");
    chain.current = chain.current.then(async () => {
      try {
        await latest.current.save(v);
        if (JSON.stringify(latest.current.value) === k) latest.current.onStatus?.("saved");
        return true;
      } catch {
        lastKey.current = "\0failed";
        latest.current.onStatus?.("error", () => void flush());
        return false;
      }
    });
    return chain.current;
  }, []);

  useEffect(() => {
    if (!enabled || key === lastKey.current) return;
    latest.current.onStatus?.("dirty");
    timer.current = setTimeout(() => void flush(), delay);
    return () => clearTimeout(timer.current);
  }, [key, enabled, delay, flush]);

  useEffect(() => () => void flush(), [flush]);

  return { flush };
}
