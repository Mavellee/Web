import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cx } from "../../lib/format";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";
const variants: Record<Variant, string> = {
  primary: "bg-plum text-ivory shadow-soft hover:bg-plum-600",
  secondary: "border border-plum/25 bg-white/70 text-plum hover:border-plum/50 hover:bg-white",
  ghost: "text-plum hover:bg-plum-50",
  quiet: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  danger: "bg-rose-ink text-white hover:bg-[#7a3243]",
};
const sizes: Record<Size, string> = { sm: "h-9 px-4 text-sm", md: "h-11 px-5 text-[0.95rem]", lg: "h-14 px-7 text-base" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx(base, variants[variant], sizes[size], className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({ variant = "primary", size = "md", className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={cx(base, variants[variant], sizes[size], className)} {...rest} />;
}
