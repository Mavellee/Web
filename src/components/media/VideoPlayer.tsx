import { useState } from "react";
import { mediaUrl, posterUrl } from "../../lib/api";
import { cx } from "../../lib/format";
import type { MediaItem } from "../../lib/types";

/**
 * Click-to-play video. Nothing beyond the poster is downloaded until the viewer presses play
 * (preload="none"), it never autoplays, and native controls provide pause, volume, mute and fullscreen.
 */
export function VideoPlayer({ item, label, className }: { item: Pick<MediaItem, "id" | "hasPoster">; label: string; className?: string }) {
  const [error, setError] = useState(false);
  if (error)
    return (
      <div role="alert" className={cx("flex flex-col items-center justify-center gap-1 bg-primary-800 p-6 text-center text-sm text-surface/85", className)}>
        <p className="font-semibold text-surface">This video can't play here.</p>
        <p>Your browser may not support its format. Try another browser or device.</p>
      </div>
    );
  return (
    // Spoken-word captions aren't available for member-uploaded clips; the written caption sits beside the player.
    <video
      src={mediaUrl(item.id)}
      poster={item.hasPoster ? posterUrl(item.id) : undefined}
      controls
      playsInline
      preload="none"
      controlsList="nodownload"
      aria-label={label}
      onError={() => setError(true)}
      className={cx("bg-scrim", className)}
    />
  );
}
