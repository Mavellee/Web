import { useState, type ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { Photo } from "../ui/Photo";
import { IntentionBadges } from "../profile/ProfileCard";
import { Badge } from "../ui/Badge";
import { ConnectionSection } from "../compat/ConnectionSection";
import { MediaFigure } from "../media/MediaFigure";
import { MediaThumb } from "../media/MediaThumb";
import { MediaLightbox } from "../media/MediaLightbox";
import type { DetailTarget } from "./DetailComposer";
import { genderLabel, INTENTIONS } from "../../lib/labels";
import { mediaOf, primaryOf, sharedSentence } from "../../lib/profile";
import { cx } from "../../lib/format";
import type { CompatResult, MediaItem, PublicProfile } from "../../lib/types";

export type EditorialData = Omit<PublicProfile, "compatibility"> & {
  compatibility?: CompatResult | null;
};

type Block = { type: "media"; item: MediaItem; n: number };

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
  onLike,
}: {
  profile: EditorialData;
  onRespond?: (d: DetailTarget) => void;
  actions?: ReactNode;
  preview?: boolean;
  connectionId?: string;
  connectionOpen?: boolean;
  onConnectionToggle?: (open: boolean) => void;
  onLike?: () => void;
}) {
  const media = mediaOf(p);
  const lead = primaryOf(media);
  const rest = media.filter((m) => m.id !== lead?.id);
  const prompts = p.prompts ?? [];
  const shared = sharedSentence(p);
  const compat =
    p.compatibility && "items" in p.compatibility
      ? (p.compatibility as CompatResult)
      : null;
  const [viewing, setViewing] = useState<number | null>(null);
  const openAt = (id: string) =>
    setViewing(
      Math.max(
        0,
        media.findIndex((m) => m.id === id),
      ),
    );
  const label = (m: MediaItem, n: number) =>
    `${m.kind === "VIDEO" ? "Video" : "Photo"} ${n} of ${p.displayName}`;

  // Their words as cards, their world, then every other photo and video at full size.
  const blocks: Block[] = [
    ...rest.map((item) => ({
      type: "media" as const,
      item,
      n: media.indexOf(item) + 1,
    })),
  ];

  const respondTo = (d: DetailTarget, text = "Respond") =>
    onRespond && (
      <button
        type="button"
        onClick={() => onRespond(d)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-surface/80 px-3.5 py-1.5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-50"
      >
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

  return (
    <article
      aria-label={`${p.displayName}'s profile`}
      className="space-y-12 sm:space-y-16"
    >
      {/* Opening: main photo and the essentials */}
      <header className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <div className="relative">
            <button
              type="button"
              onClick={() => lead && openAt(lead.id)}
              disabled={!lead}
              aria-label={
                lead ? `Open ${p.displayName}'s photos and videos` : undefined
              }
              className="group relative block w-full overflow-hidden rounded-[2rem] text-left"
            >
              <Photo
                id={lead?.id}
                focus={lead}
                alt={
                  lead?.caption ??
                  (lead
                    ? `${p.displayName}'s main photo`
                    : `${p.displayName} hasn't added a photo yet`)
                }
                className="aspect-[4/5] w-full"
                rounded="rounded-[2rem]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent px-6 pb-6 pt-28 text-surface">
                {p.isDemo && (
                  <span className="mb-2 inline-block rounded-full bg-surface/90 px-2.5 py-0.5 text-[0.7rem] font-semibold text-ink">
                    Demo profile
                  </span>
                )}
                <h2 className="font-serif text-4xl leading-none text-surface sm:text-5xl">
                  {p.displayName}
                  {p.age != null && (
                    <span className="font-normal">, {p.age}</span>
                  )}
                </h2>
                {(p.city || p.distance) && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-surface/90">
                    <Icon name="location" className="h-4 w-4" />
                    {[p.city, p.distance].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <IntentionBadges intentions={p.intentions} />
                  {p.zodiac && <Badge tone="gold">{p.zodiac.symbol} {p.zodiac.name}</Badge>}
                </div>
              </div>
            </button>
            {onLike && (
              <button
                type="button"
                onClick={onLike}
                aria-label={`Like ${p.displayName}`}
                className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-primary shadow-lift transition hover:scale-105 active:scale-95"
              >
                <Icon name="heart" className="h-7 w-7" />
              </button>
            )}
          </div>
          {lead?.caption && (
            <p className="mt-3 px-1 font-serif text-lg italic leading-snug text-ink-soft">
              {lead.caption}
            </p>
          )}
          {media.length > 1 && (
            <ul
              className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5"
              aria-label={`${p.displayName}'s photos and videos`}
            >
              {media.slice(0, 5).map((m, k) => {
                const more = k === 4 && media.length > 5 ? media.length - 4 : 0;
                return (
                  <li key={m.id} className={cx(k === 4 && "hidden sm:block")}>
                    <button
                      type="button"
                      onClick={() => openAt(m.id)}
                      aria-label={
                        more
                          ? `View all ${media.length} photos and videos`
                          : `View ${m.kind === "VIDEO" ? "video" : "photo"} ${k + 1} of ${p.displayName}`
                      }
                      className="relative block w-full overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      <MediaThumb
                        item={m}
                        alt=""
                        className="aspect-square w-full"
                        rounded="rounded-2xl"
                      />
                      {more > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center bg-ink/55 font-semibold text-surface">
                          +{more}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {lead && onRespond && (
            <div className="mt-3 px-1">
              {respondTo(mediaTarget(lead), "Like this photo")}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {p.bio && (
            <section className="rounded-3xl border hairline bg-surface/90 p-5 shadow-soft">
              <h3 className="font-sans text-sm font-semibold text-ink-muted">
                A little bit about me
              </h3>
              <p className="mt-2 leading-relaxed text-ink">{p.bio}</p>
            </section>
          )}
          {p.intentions.length > 0 && (
            <div>
              <p className="eyebrow">Looking for</p>
              <ul className="mt-3 space-y-2">
                {p.intentions.map((i) => {
                  const def = INTENTIONS.find((x) => x.value === i)!;
                  return (
                    <li key={i}>
                      <p className="font-serif text-xl">{def.title}</p>
                      <p className="text-sm text-ink-muted">
                        {def.description}
                      </p>
                    </li>
                  );
                })}
              </ul>
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
          {shared && (
            <p className="rounded-2xl bg-rose-soft px-4 py-3 text-sm font-semibold text-primary-700">
              {shared}
            </p>
          )}
        </div>
      </header>

      {/* Their words and their photos and videos, in rhythm, at a comfortable reading width */}
      <div className="mx-auto max-w-3xl space-y-12 sm:space-y-16">
        {prompts.length > 0 && (
          <section aria-labelledby={`prompts-${p.id}`}>
            <h3 id={`prompts-${p.id}`} className="font-serif text-2xl">
              {preview ? "Your prompts" : "My prompts"}
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {prompts.map((pr, k) => (
                <li
                  key={pr.key}
                  className={cx(
                    prompts.length % 2 === 1 && k === 0 && "sm:col-span-2",
                  )}
                >
                  <PromptCard
                    text={pr.text}
                    answer={pr.answer}
                    action={respondTo({
                      kind: "PROMPT",
                      ref: pr.key,
                      label: pr.text,
                      quote: pr.answer,
                    })}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        {p.interests.length > 0 && (
          <section
            aria-labelledby={`interests-${p.id}`}
            className="rounded-[2rem] border hairline bg-surface/70 p-6 sm:p-8"
          >
            <h3 id={`interests-${p.id}`} className="font-serif text-2xl">
              {p.displayName}'s world
            </h3>
            {p.sharedInterestCount > 0 && (
              <p className="mt-1 text-sm text-ink-muted">
                {p.sharedInterestCount} in common with you
              </p>
            )}
            <ul className="mt-5 flex flex-wrap gap-2">
              {p.interests.map((i) => (
                <li key={i.slug}>
                  <button
                    type="button"
                    disabled={!onRespond}
                    onClick={() =>
                      onRespond?.({
                        kind: "INTEREST",
                        ref: i.slug,
                        label: "Interest",
                        quote: i.name,
                      })
                    }
                    className={cx(
                      "rounded-full px-3.5 py-1.5 text-sm transition disabled:cursor-default",
                      i.shared
                        ? "bg-primary text-surface"
                        : "border hairline bg-surface text-ink-soft",
                      onRespond && "hover:-translate-y-0.5 hover:shadow-soft",
                    )}
                    aria-label={
                      onRespond
                        ? `Respond about ${i.name}${i.shared ? " (shared)" : ""}`
                        : undefined
                    }
                  >
                    {i.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {blocks.map((b) =>
          b.type === "media" ? (
            <MediaFigure
              key={b.item.id}
              item={b.item}
              label={label(b.item, b.n)}
              onOpen={() => openAt(b.item.id)}
              action={respondTo(
                mediaTarget(b.item),
                b.item.kind === "VIDEO" ? "Like this video" : "Like this photo",
              )}
            />
          ) : null,
        )}

        {!preview && (
          <ConnectionSection
            id={connectionId}
            userId={p.id}
            name={p.displayName}
            result={compat}
            sharedInterests={p.interests
              .filter((i) => i.shared)
              .map((i) => i.name)}
            open={connectionOpen}
            onToggle={onConnectionToggle}
          />
        )}

        {actions && (
          <>
            <div className="ornament" aria-hidden="true">
              <span className="text-[0.55rem]">&#9670;</span>
            </div>
            <section
              aria-label="Next step"
              className="rounded-[2rem] bg-parchment-deep/70 p-6 text-center sm:p-10"
            >
              <p className="font-serif text-2xl">
                Something here you'd like to ask {p.displayName} about?
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Respond to a photo, a prompt or an interest above — or simply
                like their profile.
              </p>
              <div className="mt-6">{actions}</div>
            </section>
          </>
        )}
      </div>

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

function PromptCard({
  text,
  answer,
  action,
}: {
  text: string;
  answer: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-3xl border hairline bg-surface/90 p-5 shadow-soft">
      <p className="text-sm font-semibold text-ink">{text}</p>
      <p className="mt-2 flex-1 font-serif text-xl leading-snug text-ink-soft">
        {answer}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
