import type { ReactNode } from "react";
import { cx } from "../../lib/format";

type Tone = "plum" | "sage" | "rose" | "lavender" | "gold" | "neutral";
const tones: Record<Tone, string> = {
  plum: "bg-plum-50 text-plum-700",
  sage: "bg-sage text-sage-ink",
  rose: "bg-rose-soft text-rose-ink",
  lavender: "bg-lavender-soft text-plum-700",
  gold: "bg-gold-soft text-gold-ink",
  neutral: "bg-ink/5 text-ink-soft",
};

export function Badge({ tone = "plum", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
