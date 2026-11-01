import { useState, type ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { ConnectionSection } from "../compat/ConnectionSection";
import { MediaFigure } from "../media/MediaFigure";
import { MediaLightbox } from "../media/MediaLightbox";
import type { DetailTarget } from "./DetailComposer";
import { AboutChapter, DetailsChapter, LookingForChapter, ProfileHero, PromptChapter } from "./ProfileChapters";
import { Reveal } from "./Reveal";
import { mediaOf, primaryOf } from "../../lib/profile";
import { buildStory, type Chapter } from "../../lib/profileStory";
import type { CompatResult, MediaItem, PublicProfile } from "../../lib/types";

export type EditorialData = Omit<PublicProfile, "compatibility"> & {
  compatibility?: CompatResult | null;
};

// Each photo after the first gets its own frame, so the page has rhythm and no two sit together.
const FRAMES = ["aspect-[5/6]", "aspect-[4/3]", "aspect-square"];

/**
 * A person's complete profile as a story told in order: their main photo, then their words, photos and details
 * interleaved (see buildStory), ending on what they want and how you connect. Only real content is ever shown.
 */
export function EditorialProfile({
  profile: p,
  onRespond,
  actions,
  preview,
  connectionId,
  connectionOpen,
  onConnectionToggle,
  astro,
}: {
  profile: EditorialData;
  onRespond?: (d: DetailTarget) => void;
  actions?: ReactNode;
  preview?: boolean;
  connectionId?: string;
  connectionOpen?: boolean;
  onConnectionToggle?: (open: boolean) => void;
  astro?: ReactNode;
}) {
  const media = mediaOf(p);
  const lead = primaryOf(media);
  const compat = p.compatibility && "items" in p.compatibility ? (p.compatibility as CompatResult) : null;
  const [viewing, setViewing] = useState<number | null>(null);
  const openAt = (id: string) => setViewing(Math.max(0, media.findIndex((m) => m.id === id)));

  const respondTo = (d: DetailTarget, text = "Respond") =>
    onRespond && (
      <button type="button" onClick={() => onRespond(d)} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-primary-text underline-offset-4 hover:underline">
        <Icon name="heart" className="h-4 w-4" /> {text}
      </button>
    );
  const mediaTarget = (m: MediaItem): DetailTarget => ({
    kind: "MEDIA",
    ref: m.id,
    label: m.kind === "VIDEO" ? "Video" : "Photo",
    quote: m.caption ?? "",
    media: m,
  });

  const render = (c: Chapter) => {
    switch (c.type) {
      case "about":
        return <AboutChapter p={p} onRespond={onRespond} />;
      case "details":
        return <DetailsChapter p={p} onRespond={onRespond} />;
      case "lookingFor":
        return <LookingForChapter p={p} />;
      case "prompt":
        return <PromptChapter text={c.prompt.text} answer={c.prompt.answer} variant={c.variant} action={respondTo({ kind: "PROMPT", ref: c.prompt.key, label: c.prompt.text, quote: c.prompt.answer })} />;
      case "media":
        return (
          <MediaFigure
            item={c.item}
            frame={FRAMES[c.shape % FRAMES.length]}
            label={`${c.item.kind === "VIDEO" ? "Video" : "Photo"} ${media.findIndex((m) => m.id === c.item.id) + 1} of ${p.displayName}`}
            onOpen={() => openAt(c.item.id)}
            action={respondTo(mediaTarget(c.item), c.item.kind === "VIDEO" ? "Like this video" : "Like this photo")}
          />
        );
    }
  };
  const keyOf = (c: Chapter) => (c.type === "media" ? c.item.id : c.type === "prompt" ? c.prompt.key : c.type);

  return (
    <article aria-label={`${p.displayName}'s profile`} className="mx-auto max-w-2xl space-y-9 sm:space-y-12">
      <ProfileHero p={p} lead={lead ?? undefined} onOpen={() => lead && openAt(lead.id)} action={lead && respondTo(mediaTarget(lead), "Like this photo")} />

      {buildStory(p).map((c) => (
        <Reveal key={keyOf(c)}>{render(c)}</Reveal>
      ))}

      {!preview && (
        <ConnectionSection
          id={connectionId}
          userId={p.id}
          name={p.displayName}
          result={compat}
          sharedInterests={p.interests.filter((i) => i.shared).map((i) => i.name)}
          open={connectionOpen}
          onToggle={onConnectionToggle}
        />
      )}
      {astro}

      {actions && (
        <section aria-label="Next step" className="text-center">
          <p className="font-serif text-2xl">Something here you'd like to ask {p.displayName} about?</p>
          <p className="mt-1 text-sm text-ink-muted">Respond to a photo, a prompt or an interest above, or simply like their profile.</p>
          <div className="mt-6">{actions}</div>
        </section>
      )}

      <MediaLightbox
        items={media}
        name={p.displayName}
        index={viewing}
        onClose={() => setViewing(null)}
        onLike={
          onRespond &&
          ((m) => {
            setViewing(null);
            onRespond(mediaTarget(m));
          })
        }
      />
    </article>
  );
}
