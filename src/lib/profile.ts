import type { PhotoRef, PublicProfile } from "./types";

/** Photo references with focal points, falling back to plain ids for older responses. */
export const photosOf = (p: Pick<PublicProfile, "photoIds" | "photos">): PhotoRef[] => p.photos ?? p.photoIds.map((id) => ({ id, focusX: 50, focusY: 35 }));

/** "You both love Live music and Coffee." — only from genuinely shared interests. */
export function sharedSentence(p: Pick<PublicProfile, "interests">) {
  const shared = p.interests.filter((i) => i.shared).map((i) => i.name);
  if (!shared.length) return null;
  const list = shared.length === 1 ? shared[0] : `${shared.slice(0, -1).join(", ")} and ${shared.at(-1)}`;
  return `You both enjoy ${list}.`;
}
