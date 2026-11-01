import { mediaOf, primaryOf } from "./profile";
import type { MediaItem, PublicProfile } from "./types";

type StorySource = Pick<PublicProfile, "bio" | "interests" | "intentions" | "city" | "languages" | "zodiac"> & Partial<Pick<PublicProfile, "media" | "photoIds" | "photos" | "prompts">>;
type Prompt = NonNullable<PublicProfile["prompts"]>[number];

export type Chapter =
  | { type: "about" }
  | { type: "media"; item: MediaItem; shape: number }
  | { type: "prompt"; prompt: Prompt; variant: number }
  | { type: "details" }
  | { type: "lookingFor" };

/** Interests shown with the introduction; the rest wait for the details chapter, so they arrive gradually. */
export const LEAD_INTERESTS = 6;

/**
 * The order someone is discovered in: photo, words, photo, everyday details, words, then what they want.
 * Anything missing simply drops out, and extra photos and prompts keep alternating, so no profile has a gap.
 */
export function buildStory(p: StorySource): Chapter[] {
  const media = mediaOf(p as PublicProfile);
  const lead = primaryOf(media);
  const photos = media.filter((m) => m.id !== lead?.id);
  const prompts = [...(p.prompts ?? [])];
  let shape = 0;
  let variant = 0;
  const nextMedia = (): Chapter[] => {
    const item = photos.shift();
    return item ? [{ type: "media", item, shape: shape++ }] : [];
  };
  const nextPrompt = (): Chapter[] => {
    const prompt = prompts.shift();
    return prompt ? [{ type: "prompt", prompt, variant: variant++ }] : [];
  };
  const out: Chapter[] = [];
  if (p.bio || p.interests.length > 0) out.push({ type: "about" });
  out.push(...nextMedia(), ...nextPrompt(), ...nextMedia());
  if (p.city || p.languages.length > 0 || p.zodiac || p.interests.length > LEAD_INTERESTS) out.push({ type: "details" });
  out.push(...nextPrompt());
  while (photos.length || prompts.length) out.push(...nextMedia(), ...nextPrompt());
  if (p.intentions.length > 0) out.push({ type: "lookingFor" });
  return out;
}
