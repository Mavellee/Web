import { cn } from "@/lib/utils";

/** Faceted iceberg mark. Colours come from CSS so it follows the brand tokens. */
export function IcebergMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="Iceberg"
      className={cn("size-24", className)}
    >
      <polygon points="60,6 86,52 34,52" fill="#b9a6e8" />
      <polygon points="60,6 86,52 66,52" fill="#8f7fd6" />
      <polygon points="34,52 60,6 52,52" fill="#d9ccf5" />
      <polygon points="14,70 34,52 66,52 106,70 60,112" fill="#e6c6df" />
      <polygon points="14,70 34,52 60,70" fill="#f2dcec" />
      <polygon points="106,70 86,52 60,70" fill="#c9a0c8" />
      <polygon points="60,70 14,70 60,112" fill="#d9a9cf" />
      <polygon points="60,70 106,70 60,112" fill="#b78bbd" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-4xl font-semibold tracking-tight", className)}>
      Iceberg
    </span>
  );
}
