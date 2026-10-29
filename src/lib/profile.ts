import type { MediaItem, PhotoRef, PublicProfile } from "./types";

/** Photo references with focal points, falling back to plain ids for older responses. */
export const photosOf = (p: Pick<PublicProfile, "photoIds" | "photos">): PhotoRef[] => p.photos ?? p.photoIds.map((id) => ({ id, focusX: 50, focusY: 35 }));

/** "You both love Live music and Coffee." — only from genuinely shared interests. */
export function sharedSentence(p: Pick<PublicProfile, "interests">) {
  const shared = p.interests.filter((i) => i.shared).map((i) => i.name);
  if (!shared.length) return null;
  const list = shared.length === 1 ? shared[0] : `${shared.slice(0, -1).join(", ")} and ${shared.at(-1)}`;
  return `You both enjoy ${list}.`;
}

/** The whole gallery in the owner's order; older payloads without `media` fall back to their photos. */
export const mediaOf = (p: Pick<PublicProfile, "photoIds" | "photos" | "media">): MediaItem[] =>
  p.media ?? photosOf(p).map((ph, i) => ({ id: ph.id, kind: "IMAGE" as const, caption: ph.caption ?? null, isPrimary: i === 0, focusX: ph.focusX, focusY: ph.focusY, durationMs: null, hasPoster: false }));

/** The member's chosen main photo (never a video). */
export const primaryOf = (items: MediaItem[]) => items.find((m) => m.kind === "IMAGE" && m.isPrimary) ?? items.find((m) => m.kind === "IMAGE") ?? null;
