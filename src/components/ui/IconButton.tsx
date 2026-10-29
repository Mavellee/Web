import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "../../lib/format";
import { Icon, type IconName } from "./Icon";

type Tone = "plain" | "soft" | "solid" | "danger";
const tones: Record<Tone, string> = {
  plain: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  soft: "border border-line bg-surface text-ink hover:border-primary/40 hover:text-primary",
  solid: "bg-primary text-surface shadow-soft hover:bg-primary-hover",
  danger: "text-error hover:bg-error-soft",
};

/** Icon-only button. `label` is required so every icon button has an accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; tone?: Tone; size?: "sm" | "md" | "lg" }>(function IconButton(
  { icon, label, tone = "plain", size = "md", className, type = "button", ...rest },
  ref,
) {
  const dims = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  return (
    <button ref={ref} type={type} aria-label={label} title={label} className={cx("inline-flex shrink-0 items-center justify-center rounded-full transition duration-200 active:scale-95 disabled:opacity-50", dims, tones[tone], className)} {...rest}>
      <Icon name={icon} className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </button>
  );
});
