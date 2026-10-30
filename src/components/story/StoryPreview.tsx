import { Photo } from "../ui/Photo";
import { Icon } from "../ui/Icon";
import { IntentionBadges } from "../profile/ProfileCard";
import type { OwnProfile, PublicProfile } from "../../lib/types";

const published = (m: { status: string }) => m.status === "APPROVED";

/** Builds the same shape other members receive, from the member's own saved data. */
export function toPreview(p: OwnProfile, id: string, interests: { slug: string; name: string }[]): Omit<PublicProfile, "compatibility"> {
  return {
    id,
    displayName: p.displayName || "Your name",
    age: p.age,
    gender: p.gender ?? "OTHER",
    city: p.city,
    distance: null,
    bio: p.bio || null,
    languages: p.languages,
    intentions: p.intentions,
    interests: p.interests.map((slug) => ({ slug, name: interests.find((i) => i.slug === slug)?.name ?? slug, shared: false })),
    sharedInterestCount: 0,
    // Exactly what others receive: approved items only, photos primary-first, the gallery in your order.
    photoIds: p.photos.filter(published).map((x) => x.id),
    photos: p.photos.filter(published).map((x) => ({ id: x.id, focusX: x.focusX, focusY: x.focusY, caption: x.caption })),
    media: p.media.filter(published).map(({ id, kind, caption, isPrimary, focusX, focusY, durationMs, hasPoster }) => ({ id, kind, caption, isPrimary, focusX, focusY, durationMs, hasPoster })),
    prompts: p.prompts,
    isApprovedExpert: false,
  };
}

/** Compact live preview shown beside the onboarding steps. Placeholders are clearly marked. */
export function StoryPreviewCard({ profile: p }: { profile: Omit<PublicProfile, "compatibility"> }) {
  const photo = p.photos?.[0];
  const prompt = p.prompts?.[0];
  return (
    <article className="overflow-hidden rounded-[1.75rem] border hairline bg-surface shadow-soft" aria-label="Preview of your profile">
      <div className="relative">
        {photo ? (
          <Photo id={photo.id} focus={photo} alt="Your main photo" className="aspect-[4/5] w-full" rounded="rounded-none" />
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-parchment-deep text-ink-muted">
            <Icon name="image" className="h-8 w-8" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Placeholder — your photo goes here</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/75 to-transparent px-5 pb-4 pt-16 text-surface">
          <p className="font-serif text-2xl text-surface">
            {p.displayName}
            {p.age != null && <span className="font-normal">, {p.age}</span>}
          </p>
          <p className="text-xs text-surface/85">{p.city ?? "Your city"}</p>
        </div>
      </div>
      <div className="space-y-3 p-5">
        {p.intentions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <IntentionBadges intentions={p.intentions} />
          </div>
        )}
        {p.bio && <p className="text-sm leading-relaxed text-ink-soft">{p.bio}</p>}
        {prompt ? (
          <div>
            <p className="text-xs text-ink-muted">{prompt.text}</p>
            <p className="mt-1 font-serif text-lg leading-snug">{prompt.answer}</p>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-3 text-xs text-ink-muted">Your prompt answers will appear here.</p>
        )}
        {p.interests.length > 0 && <p className="text-xs text-ink-muted">{p.interests.slice(0, 5).map((i) => i.name).join(" · ")}</p>}
      </div>
    </article>
  );
}
