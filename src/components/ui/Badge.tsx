import type { ReactNode } from "react";
import { cx } from "../../lib/format";

type Tone = "primary" | "rose" | "gold" | "success" | "neutral";
const tones: Record<Tone, string> = {
  primary: "bg-primary-50 text-primary-700",
  rose: "bg-rose-soft text-accent",
  gold: "bg-gold-soft text-gold-ink",
  success: "bg-success-soft text-success",
  neutral: "bg-ink/5 text-ink-soft",
};

export function Badge({ tone = "primary", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
