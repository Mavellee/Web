import { useId } from "react";
import { Link } from "react-router-dom";
import { cx } from "../../lib/format";

type Tone = "default" | "light";

/**
 * The Knot seal: a burgundy medallion with an antique-gold rim, holding two interlaced rings — a love knot.
 * Each ring passes over the other once and under it once, so it reads as a real knot, not two circles.
 * `light` is for burgundy backgrounds (app sidebar, footer).
 */
export function LogoMark({ className = "h-9 w-9", tone = "default" }: { className?: string; tone?: Tone }) {
  const light = tone === "light";
  const id = useId().replace(/:/g, "");
  const gap = light ? "stroke-surface" : undefined;
  const gapStroke = light ? undefined : `url(#${id}-seal)`;
  // Seal: pressed-wax depth on burgundy. Rings: antique gold with a soft champagne sheen.
  // Both gradients use the emblem's own coordinates, so the weave gaps match the seal behind them exactly.
  const ring = light ? "stroke-primary" : "";
  const ringStroke = light ? undefined : `url(#${id}-gold)`;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {!light && (
        <defs>
          <radialGradient id={`${id}-seal`} gradientUnits="userSpaceOnUse" cx="15" cy="13" r="30">
            <stop offset="0%" stopColor="var(--color-primary-hover)" />
            <stop offset="70%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-primary-800)" />
          </radialGradient>
          <linearGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" x1="8" y1="11" x2="32" y2="29">
            <stop offset="0%" stopColor="#E9D6A6" />
            <stop offset="45%" stopColor="var(--color-gold)" />
            <stop offset="100%" stopColor="#A9853F" />
          </linearGradient>
        </defs>
      )}
      <circle cx="20" cy="20" r="19.5" fill={light ? undefined : `url(#${id}-seal)`} className={light ? "fill-surface" : undefined} />
      {/* Fine gold rim, like the edge of a wax seal. */}
      <circle cx="20" cy="20" r="17" fill="none" strokeWidth="0.6" className={light ? "stroke-primary/40" : "stroke-gold/60"} />
      <g fill="none" strokeLinecap="round" strokeWidth="2.1" className={ring} stroke={ringStroke}>
        <circle cx="16" cy="20" r="7.5" />
        <circle cx="24" cy="20" r="7.5" />
      </g>
      {/* Over-under weave: re-draw one arc of each ring on top, with a gap cut beneath it. */}
      <path d="M17.94 12.76A7.5 7.5 0 0 1 21.75 15.18" fill="none" strokeWidth="4.2" className={gap} stroke={gapStroke} />
      <path d="M17.94 12.76A7.5 7.5 0 0 1 21.75 15.18" fill="none" strokeWidth="2.1" strokeLinecap="round" className={ring} stroke={ringStroke} />
      <path d="M22.06 27.24A7.5 7.5 0 0 1 18.25 24.82" fill="none" strokeWidth="4.2" className={gap} stroke={gapStroke} />
      <path d="M22.06 27.24A7.5 7.5 0 0 1 18.25 24.82" fill="none" strokeWidth="2.1" strokeLinecap="round" className={ring} stroke={ringStroke} />
    </svg>
  );
}

/** "Knot" set in Fraunces at display size, with its soft, slightly wonky letterforms. */
export function Wordmark({ className, tone = "default" }: { className?: string; tone?: Tone }) {
  return (
    <span
      className={cx("font-serif font-semibold leading-none tracking-[-0.025em]", tone === "light" ? "text-surface" : "text-primary", className)}
      style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
    >
      Knot
    </span>
  );
}

const SIZES = {
  sm: { mark: "h-7 w-7", word: "text-[1.6rem]", gap: "gap-2" },
  md: { mark: "h-9 w-9", word: "text-[1.95rem]", gap: "gap-2.5" },
  lg: { mark: "h-12 w-12", word: "text-[2.6rem]", gap: "gap-3" },
} as const;

/** Seal and wordmark together. */
export function LogoLockup({ tone = "default", size = "md", className }: { tone?: Tone; size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={cx("inline-flex items-center", s.gap, className)}>
      <LogoMark tone={tone} className={cx(s.mark, "transition-transform duration-500 group-hover:rotate-[20deg]")} />
      <Wordmark tone={tone} className={s.word} />
    </span>
  );
}

export function Logo({ to = "/", tone = "default", size = "md" }: { to?: string; tone?: Tone; size?: keyof typeof SIZES }) {
  return (
    <Link to={to} className={cx("group inline-flex items-center rounded-full", tone === "light" && "focus-visible:ring-gold focus-visible:ring-offset-primary")} aria-label="Knot home">
      <LogoLockup tone={tone} size={size} />
    </Link>
  );
}
