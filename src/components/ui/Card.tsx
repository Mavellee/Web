import type { HTMLAttributes } from "react";
import { cx } from "../../lib/format";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-3xl border border-[#EFE4DA] bg-white/75 shadow-soft", className)} {...rest} />;
}
