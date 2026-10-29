import { useState } from "react";
import { posterUrl } from "../../lib/api";
import { cx } from "../../lib/format";
import { Icon } from "../ui/Icon";
import { Photo } from "../ui/Photo";
import type { MediaItem } from "../../lib/types";

export const formatDuration = (ms: number | null | undefined) => {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** A video's still frame (never the video itself), or a designed placeholder when there's no poster. */
export function VideoPoster({ item, alt, className, fit = "cover", onLoad }: { item: Pick<MediaItem, "id" | "hasPoster" | "focusX" | "focusY">; alt: string; className?: string; fit?: "cover" | "natural"; onLoad?: () => void }) {
  const [failed, setFailed] = useState(false);
  if (!item.hasPoster || failed)
    return (
      <div {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })} className={cx("flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary text-surface/80", fit === "natural" && "aspect-[4/5]", className)}>
        <Icon name="video" className="h-10 w-10" />
      </div>
    );
  return (
    <img
      src={posterUrl(item.id)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={onLoad}
      onError={() => setFailed(true)}
      style={{ objectPosition: `${item.focusX}% ${item.focusY}%` }}
      className={cx(fit === "cover" ? "h-full w-full object-cover" : "h-auto w-full", className)}
    />
  );
}

/** Play badge with the clip length, laid over a video's poster. */
export function PlayBadge({ durationMs, size = "md" }: { durationMs: number | null; size?: "sm" | "md" }) {
  return (
    <span className={cx("pointer-events-none absolute inset-0 flex items-center justify-center")} aria-hidden="true">
      <span className={cx("flex items-center gap-1.5 rounded-full bg-ink/60 font-semibold text-surface backdrop-blur-sm", size === "md" ? "px-4 py-2.5 text-sm" : "px-2 py-1 text-[0.7rem]")}>
        <Icon name="play" filled className={size === "md" ? "h-5 w-5" : "h-3.5 w-3.5"} />
        {formatDuration(durationMs)}
      </span>
    </span>
  );
}

/** A small cropped tile for any gallery item (workspace, composer, likes). */
export function MediaThumb({ item, alt, className, rounded = "rounded-2xl" }: { item: MediaItem; alt: string; className?: string; rounded?: string }) {
  if (item.kind === "IMAGE") return <Photo id={item.id} focus={item} alt={alt} className={className} rounded={rounded} />;
  return (
    <div className={cx("relative overflow-hidden bg-parchment-deep", rounded, className)}>
      <VideoPoster item={item} alt={alt} />
      <PlayBadge durationMs={item.durationMs} size="sm" />
    </div>
  );
}

/** Thumbnail for a liked photo or video referenced only by id (likes and first messages). */
export function DetailMediaThumb({ id, kind, className }: { id: string; kind?: "IMAGE" | "VIDEO"; className?: string }) {
  return kind === "VIDEO" ? (
    <div className={cx("relative overflow-hidden rounded-xl bg-parchment-deep", className)}>
      <VideoPoster item={{ id, hasPoster: true, focusX: 50, focusY: 50 }} alt="" />
      <PlayBadge durationMs={null} size="sm" />
    </div>
  ) : (
    <Photo id={id} alt="" className={className} rounded="rounded-xl" />
  );
}

