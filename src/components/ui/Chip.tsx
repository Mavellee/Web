import type { ReactNode } from "react";
import { cx } from "../../lib/format";

/** A toggleable pill, exposed as a checkbox/radio for assistive tech. */
export function Chip({ selected, onToggle, children, disabled, role = "checkbox" }: { selected: boolean; onToggle: () => void; children: ReactNode; disabled?: boolean; role?: "checkbox" | "radio" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition duration-150",
        selected ? "border-primary bg-primary text-surface shadow-soft" : "border-line bg-surface/70 text-ink-soft hover:border-primary/40 hover:text-ink",
        disabled && "opacity-50",
      )}
    >
      {selected && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
