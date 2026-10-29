import { Link } from "react-router-dom";
import { cx } from "../../lib/format";

type Tone = "default" | "light";

export function LogoMark({ className = "h-8 w-8", tone = "default" }: { className?: string; tone?: Tone }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" className={tone === "light" ? "fill-surface" : "fill-primary"} />
      <path d="M14 13c-4 0-6.5 3.2-6.5 7s2.5 7 6.5 7c3 0 5-2.4 6.2-4.8l2.4-4.4C23.8 15.4 25.8 13 29 13c4 0 6.5 3.2 6.5 7S33 27 29 27c-3 0-5-2.4-6.2-4.8" fill="none" className={tone === "light" ? "stroke-primary" : "stroke-surface"} strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="10" r="2" className="fill-gold" />
    </svg>
  );
}

/** `tone="light"` is for burgundy surfaces (app sidebar, footer). */
export function Logo({ to = "/", tone = "default" }: { to?: string; tone?: Tone }) {
  return (
    <Link to={to} className={cx("group inline-flex items-center gap-2.5 rounded-full", tone === "light" && "focus-visible:ring-gold focus-visible:ring-offset-primary")} aria-label="Knot home">
      <LogoMark tone={tone} className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6" />
      <span className={cx("font-serif text-2xl font-semibold tracking-tight", tone === "light" ? "text-surface" : "text-ink")}>knot</span>
    </Link>
  );
}
