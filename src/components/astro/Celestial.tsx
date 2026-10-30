import { cx } from "../../lib/format";

const STARS = [[12, 22], [30, 8], [52, 18], [70, 6], [88, 26], [8, 58], [94, 62], [22, 84], [48, 92], [78, 86]];

/** A quiet constellation, for parchment backgrounds. */
export function Constellation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={cx("pointer-events-none absolute inset-0 h-full w-full text-gold/40", className)}>
      <polyline points="12,22 30,8 52,18 70,6 88,26" fill="none" stroke="currentColor" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <polyline points="8,58 22,84 48,92 78,86 94,62" fill="none" stroke="currentColor" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      {STARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.5" fill="currentColor" />
      ))}
    </svg>
  );
}

function Chart({ cx: x, spin }: { cx: number; spin: string }) {
  return (
    <g className={spin} style={{ transformOrigin: `${x}px 60px`, transformBox: "view-box" }}>
      <circle cx={x} cy="60" r="44" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
      <circle cx={x} cy="60" r="33" fill="none" stroke="var(--color-gold)" strokeWidth="0.4" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <line key={i} x1={x + 33 * Math.cos(a)} y1={60 + 33 * Math.sin(a)} x2={x + 44 * Math.cos(a)} y2={60 + 44 * Math.sin(a)} stroke="var(--color-gold)" strokeWidth="0.5" />;
      })}
    </g>
  );
}

/** Two charts drawing together. Purely decorative: `busy` animates only while the server is really working. */
export function TwoCharts({ busy, className }: { busy?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 200 120" aria-hidden="true" className={cx("mx-auto w-full max-w-xs text-primary", className)}>
      <Chart cx={busy ? 76 : 70} spin={busy ? "motion-safe:animate-[spin_40s_linear_infinite]" : ""} />
      <Chart cx={busy ? 124 : 130} spin={busy ? "motion-safe:animate-[spin_40s_linear_infinite_reverse]" : ""} />
      <circle cx="100" cy="60" r="2.4" fill="var(--color-primary)" />
    </svg>
  );
}
