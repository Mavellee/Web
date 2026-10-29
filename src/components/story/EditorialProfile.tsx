import { useState, type ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { Photo } from "../ui/Photo";
import { IntentionBadges } from "../profile/ProfileCard";
import { ConnectionSection } from "../compat/ConnectionSection";
import { MediaFigure } from "../media/MediaFigure";
import { MediaLightbox } from "../media/MediaLightbox";
import type { DetailTarget } from "./DetailComposer";
import { genderLabel, INTENTIONS } from "../../lib/labels";
import { mediaOf, primaryOf, sharedSentence } from "../../lib/profile";
import { cx } from "../../lib/format";
import type { CompatResult, MediaItem, PromptAnswer, PublicProfile } from "../../lib/types";

export type EditorialData = Omit<PublicProfile, "compatibility"> & { compatibility?: CompatResult | null };

type Block = { type: "media"; item: MediaItem; n: number } | { type: "prompt"; prompt: PromptAnswer; lead?: boolean } | { type: "interests" };

/**
 * A person's complete profile as one editorial page: their main photo and essentials, then every approved
 * photo and video (in their order, each with its own caption) woven between their own words, their world,
 * and how you connect. Sections only appear when there is real content; nothing is invented to fill gaps.
 */
export function EditorialProfile({
  profile: p,
  onRespond,
  actions,
  preview,
  connectionId,
  connectionOpen,
  onConnectionToggle,
}: {
  profile: EditorialData;
  onRespond?: (d: DetailTarget) => void;
  actions?: ReactNode;
  preview?: boolean;
  connectionId?: string;
  connectionOpen?: boolean;
  onConnectionToggle?: (open: boolean) => void;
}) {
  const media = mediaOf(p);
  const lead = primaryOf(media);
  const rest = media.filter((m) => m.id !== lead?.id);
  const prompts = p.prompts ?? [];
  const shared = sharedSentence(p);
  const compat = p.compatibility && "items" in p.compatibility ? (p.compatibility as CompatResult) : null;
  const [viewing, setViewing] = useState<number | null>(null);
  const openAt = (id: string) => setViewing(Math.max(0, media.findIndex((m) => m.id === id)));
  const photos = media.filter((m) => m.kind === "IMAGE").length;
  const videos = media.length - photos;
  const label = (m: MediaItem, n: number) => `${m.kind === "VIDEO" ? "Video" : "Photo"} ${n} of ${p.displayName}`;

  // Their words given room first, then photography and words in turn; interests after the opening rhythm.
  const blocks: Block[] = [];
  if (prompts[0]) blocks.push({ type: "prompt", prompt: prompts[0], lead: true });
  const others = prompts.slice(1);
  for (let k = 0; k < Math.max(rest.length, others.length); k++) {
    if (rest[k]) blocks.push({ type: "media", item: rest[k], n: media.indexOf(rest[k]) + 1 });
    if (others[k]) blocks.push({ type: "prompt", prompt: others[k] });
    if (k === 0 && p.interests.length) blocks.push({ type: "interests" });
  }
  if (!blocks.some((b) => b.type === "interests") && p.interests.length) blocks.push({ type: "interests" });

  const respondTo = (d: DetailTarget, text = "Respond") =>
    onRespond && (
      <button type="button" onClick={() => onRespond(d)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-surface/80 px-3.5 py-1.5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-50">
        <Icon name="heart" className="h-4 w-4" /> {text}
      </button>
    );
  const mediaTarget = (m: MediaItem): DetailTarget => ({ kind: "MEDIA", ref: m.id, label: m.kind === "VIDEO" ? "Video" : "Photo", quote: m.caption ?? "", media: m });

  return (
    <article aria-label={`${p.displayName}'s profile`} className="space-y-12 sm:space-y-16">
      {/* Opening: main photo and the essentials */}
      <header className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end">
        <div className="relative">
          <button type="button" onClick={() => lead && openAt(lead.id)} disabled={!lead} aria-label={lead ? `Open ${p.displayName}'s photos and videos` : undefined} className="group relative block w-full overflow-hidden rounded-[2rem] text-left">
            <Photo id={lead?.id} focus={lead} alt={lead?.caption ?? (lead ? `${p.displayName}'s main photo` : `${p.displayName} hasn't added a photo yet`)} className="aspect-[4/5] w-full" rounded="rounded-[2rem]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent px-6 pb-6 pt-28 text-surface">
              {p.isDemo && <span className="mb-2 inline-block rounded-full bg-surface/90 px-2.5 py-0.5 text-[0.7rem] font-semibold text-ink">Demo profile</span>}
              <h2 className="font-serif text-4xl leading-none text-surface sm:text-5xl">
                {p.displayName}
                {p.age != null && <span className="font-normal">, {p.age}</span>}
              </h2>
              {(p.city || p.distance) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-surface/90">
                  <Icon name="location" className="h-4 w-4" />
                  {[p.city, p.distance].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <IntentionBadges intentions={p.intentions} />
              </div>
            </div>
            {media.length > 1 && (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ink/55 px-3 py-1.5 text-xs font-semibold text-surface backdrop-blur-sm">
                <Icon name="grid" className="h-3.5 w-3.5" />
                {photos} photo{photos === 1 ? "" : "s"}
                {videos > 0 && ` · ${videos} video${videos === 1 ? "" : "s"}`}
              </span>
            )}
          </button>
          {lead?.caption && <p className="mt-3 px-1 font-serif text-lg italic leading-snug text-ink-soft">{lead.caption}</p>}
          {lead && onRespond && <div className="mt-3 px-1">{respondTo(mediaTarget(lead), "Like this photo")}</div>}
        </div>

        <div className="space-y-6">
          {p.intentions.length > 0 && (
            <div>
              <p className="eyebrow">Looking for</p>
              <ul className="mt-3 space-y-2">
                {p.intentions.map((i) => {
                  const def = INTENTIONS.find((x) => x.value === i)!;
                  return (
                    <li key={i}>
                      <p className="font-serif text-xl">{def.title}</p>
                      <p className="text-sm text-ink-muted">{def.description}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {p.bio && (
            <div>
              <p className="eyebrow">About</p>
              <p className="mt-3 text-lg leading-relaxed text-ink-soft">{p.bio}</p>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t hairline pt-5 text-sm">
            <div>
              <dt className="text-ink-muted">Gender</dt>
              <dd className="font-semibold">{genderLabel(p.gender)}</dd>
            </div>
            {p.languages.length > 0 && (
              <div>
                <dt className="text-ink-muted">Speaks</dt>
                <dd className="font-semibold">{p.languages.join(", ")}</dd>
              </div>
            )}
            {p.city && (
              <div>
                <dt className="text-ink-muted">Lives in</dt>
                <dd className="font-semibold">{p.city}</dd>
              </div>
            )}
            {p.interests.length > 0 && (
              <div>
                <dt className="text-ink-muted">Interests</dt>
                <dd className="font-semibold">{p.interests.length}</dd>
              </div>
            )}
          </dl>
          {shared && <p className="rounded-2xl bg-rose-soft px-4 py-3 text-sm font-semibold text-primary-700">{shared}</p>}
        </div>
      </header>

      {/* Their words and their photos and videos, in rhythm, at a comfortable reading width */}
      <div className="mx-auto max-w-3xl space-y-12 sm:space-y-16">
        {blocks.map((b, k) =>
          b.type === "media" ? (
            <MediaFigure
              key={b.item.id}
              item={b.item}
              label={label(b.item, b.n)}
              onOpen={() => openAt(b.item.id)}
              action={respondTo(mediaTarget(b.item), b.item.kind === "VIDEO" ? "Like this video" : "Like this photo")}
            />
          ) : b.type === "prompt" ? (
            <PromptBlock key={b.prompt.key} text={b.prompt.text} answer={b.prompt.answer} size={b.lead ? "lg" : "md"} tone={b.lead ? undefined : k % 2 ? "rose" : "parchment"} action={respondTo({ kind: "PROMPT", ref: b.prompt.key, label: b.prompt.text, quote: b.prompt.answer })} />
          ) : (
            <section key="interests" aria-labelledby={`interests-${p.id}`} className="rounded-[2rem] border hairline bg-surface/70 p-6 sm:p-8">
              <h3 id={`interests-${p.id}`} className="font-serif text-2xl">
                {p.displayName}'s world
              </h3>
              {p.sharedInterestCount > 0 && <p className="mt-1 text-sm text-ink-muted">{p.sharedInterestCount} in common with you</p>}
              <ul className="mt-5 flex flex-wrap gap-2">
                {p.interests.map((i) => (
                  <li key={i.slug}>
                    <button
                      type="button"
                      disabled={!onRespond}
                      onClick={() => onRespond?.({ kind: "INTEREST", ref: i.slug, label: "Interest", quote: i.name })}
                      className={cx("rounded-full px-3.5 py-1.5 text-sm transition disabled:cursor-default", i.shared ? "bg-primary text-surface" : "border hairline bg-surface text-ink-soft", onRespond && "hover:-translate-y-0.5 hover:shadow-soft")}
                      aria-label={onRespond ? `Respond about ${i.name}${i.shared ? " (shared)" : ""}` : undefined}
                    >
                      {i.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}

        {!preview && <ConnectionSection id={connectionId} userId={p.id} name={p.displayName} result={compat} sharedInterests={p.interests.filter((i) => i.shared).map((i) => i.name)} open={connectionOpen} onToggle={onConnectionToggle} />}

        {actions && (
          <>
            <div className="ornament" aria-hidden="true">
              <span className="text-[0.55rem]">&#9670;</span>
            </div>
            <section aria-label="Next step" className="rounded-[2rem] bg-parchment-deep/70 p-6 text-center sm:p-10">
              <p className="font-serif text-2xl">Something here you'd like to ask {p.displayName} about?</p>
              <p className="mt-1 text-sm text-ink-muted">Respond to a photo, a prompt or an interest above — or simply like their profile.</p>
              <div className="mt-6">{actions}</div>
            </section>
          </>
        )}
      </div>

      <MediaLightbox items={media} name={p.displayName} index={viewing} onClose={() => setViewing(null)} />
    </article>
  );
}

function PromptBlock({ text, answer, action, size = "md", tone }: { text: string; answer: string; action?: ReactNode; size?: "md" | "lg"; tone?: "rose" | "parchment" }) {
  return (
    <section className={cx("rounded-[2rem]", size === "lg" ? "px-1 py-2 sm:px-8" : "p-6 sm:p-8", tone === "parchment" && "border hairline bg-parchment-deep/60", tone === "rose" && "bg-rose-soft/70")}>
      <p className="text-sm font-semibold text-ink-muted">{text}</p>
      <span aria-hidden="true" className="mt-2 block h-6 font-serif text-5xl leading-none text-rose">
        &ldquo;
      </span>
      <p className={cx("mt-1 font-serif leading-snug text-ink", size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl")}>{answer}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
