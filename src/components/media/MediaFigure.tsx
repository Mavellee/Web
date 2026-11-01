import { useState, type ReactNode } from "react";
import { photoUrl } from "../../lib/api";
import { cx } from "../../lib/format";
import { Icon } from "../ui/Icon";
import { PlayBadge, VideoPoster } from "./MediaThumb";
import type { MediaItem } from "../../lib/types";

/**
 * One gallery item inside a profile: shown at its own aspect ratio (tall portraits are capped and
 * cropped around the owner's focal point) or in a given frame, with its caption beneath so it never covers the photo.
 * Tapping opens the full viewer; videos only ever show their still frame here.
 */
export function MediaFigure({ item, label, onOpen, action, className, frame }: { item: MediaItem; label: string; onOpen: () => void; action?: ReactNode; className?: string; frame?: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  return (
    <figure className={cx("space-y-3", className)}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${label}${item.caption ? `: ${item.caption}` : ""}`}
        className="group relative block w-full overflow-hidden rounded-[1.75rem] bg-parchment-deep text-left"
      >
        {item.kind === "IMAGE" ? (
          state === "error" ? (
            <div role="img" aria-label={label} className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-rose-mist to-rose-soft text-sm text-ink-muted">
              This photo couldn't load.
            </div>
          ) : (
            <img
              src={photoUrl(item.id)}
              alt={item.caption ?? label}
              loading="lazy"
              decoding="async"
              onLoad={() => setState("loaded")}
              onError={() => setState("error")}
              style={{ objectPosition: `${item.focusX}% ${item.focusY}%` }}
              className={cx("block max-h-[85vh] w-full object-cover transition duration-500 group-hover:scale-[1.01]", frame, state === "loading" ? cx(!frame && "aspect-[4/5]", "opacity-0") : cx(!frame && "h-auto", "opacity-100"))}
            />
          )
        ) : (
          <>
            <VideoPoster item={item} alt={item.caption ?? label} fit="natural" className="block max-h-[85vh] w-full object-cover" />
            <PlayBadge durationMs={item.durationMs} />
          </>
        )}
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-scrim/45 p-2 text-surface opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
          <Icon name="expand" className="h-4 w-4" />
        </span>
      </button>
      {(item.caption || action) && (
        <figcaption className="flex items-start justify-between gap-4 px-1">
          {item.caption ? <p className="font-serif text-lg italic leading-snug text-ink-soft">{item.caption}</p> : <span />}
          {action}
        </figcaption>
      )}
    </figure>
  );
}
