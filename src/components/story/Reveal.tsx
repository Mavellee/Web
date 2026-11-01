import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../../lib/format";

/** Fades a chapter in as it reaches the screen. Content stays visible without observer support or with reduced motion. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined" || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (shown || !ref.current) return;
    const seen = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setShown(true);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    seen.observe(ref.current);
    return () => seen.disconnect();
  }, [shown]);
  return <div ref={ref} className={cx("transition duration-700 ease-out", shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0", className)}>{children}</div>;
}
