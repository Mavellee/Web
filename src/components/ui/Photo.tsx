import { useState } from "react";
import { photoUrl } from "../../lib/api";
import { cx } from "../../lib/format";

function Fallback({ alt, className, rounded }: { alt: string; className?: string; rounded: string }) {
  return (
    <div className={cx("flex items-center justify-center bg-gradient-to-br from-lavender-soft to-rose-soft text-plum-300", rounded, className)} role="img" aria-label={alt}>
      <svg viewBox="0 0 24 24" className="h-1/3 max-h-16 w-1/3 max-w-16" aria-hidden="true">
        <circle cx="12" cy="9" r="4" fill="currentColor" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Member photo served by the API, with a skeleton while loading and a graceful fallback on error. */
/** `focus` is the member's chosen focal point (0–100 %), applied as a non-destructive crop. */
export function Photo({ id, alt, className, rounded = "rounded-3xl", position = "object-center", focus }: { id?: string | null; alt: string; className?: string; rounded?: string; position?: string; focus?: { focusX: number; focusY: number } | null }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  if (!id || state === "error") return <Fallback alt={alt} className={className} rounded={rounded} />;
  return (
    <div className={cx("relative overflow-hidden bg-[#EFE4DA]", rounded, className)}>
      <img
        src={photoUrl(id)}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        style={focus ? { objectPosition: `${focus.focusX}% ${focus.focusY}%` } : undefined}
        className={cx("h-full w-full object-cover transition-opacity duration-500", !focus && position, state === "loaded" ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}

export function Avatar({ id, name, size = "h-12 w-12" }: { id?: string | null; name: string; size?: string }) {
  return <Photo id={id} alt={name} className={cx(size, "shrink-0")} rounded="rounded-full" position="object-top" />;
}
