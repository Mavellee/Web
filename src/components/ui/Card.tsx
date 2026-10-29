import type { HTMLAttributes } from "react";
import { cx } from "../../lib/format";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-3xl border border-line bg-surface/75 shadow-soft", className)} {...rest} />;
}
