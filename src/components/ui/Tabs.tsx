import { useRef, type KeyboardEvent } from "react";
import { cx } from "../../lib/format";

/** Accessible tab list (arrow keys move between tabs). Panels are rendered by the caller. */
export function Tabs<T extends string>({ tabs, value, onChange, label, className }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next].value);
  };
  return (
    <div role="tablist" aria-label={label} className={cx("inline-flex max-w-full gap-1 overflow-x-auto rounded-full border hairline bg-white/60 p-1", className)}>
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(t.value)}
            className={cx("inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-200", active ? "bg-ink text-ivory shadow-soft" : "text-ink-soft hover:text-ink")}
          >
            {t.label}
            {t.count !== undefined && <span className={cx("rounded-full px-1.5 text-xs", active ? "bg-ivory/20" : "bg-ink/5")}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
