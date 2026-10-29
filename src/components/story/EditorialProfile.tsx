import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Photo } from "../ui/Photo";
import { IntentionBadges } from "../profile/ProfileCard";
import { AiPanel } from "../app/AiPanel";
import { CompatibilityBreakdown } from "../compat/CompatibilityBreakdown";
import { PhotoCarousel } from "./PhotoCarousel";
import type { DetailTarget } from "./DetailComposer";
import { genderLabel, INTENTIONS } from "../../lib/labels";
import { photosOf, sharedSentence } from "../../lib/profile";
import { cx } from "../../lib/format";
import type { CompatResult, PublicProfile } from "../../lib/types";

export type EditorialData = Omit<PublicProfile, "compatibility"> & { compatibility?: CompatResult | null };

/**
 * A person's profile as an editorial page with a deliberate rhythm:
 * opening photo → their words → photography → shared world → more of their words → insights → a natural next step.
 * Sections only appear when there is real content; nothing is invented to fill gaps.
 */
export function EditorialProfile({ profile: p, onRespond, actions, preview }: { profile: EditorialData; onRespond?: (d: DetailTarget) => void; actions?: ReactNode; preview?: boolean }) {
  const photos = photosOf(p);
  const prompts = p.prompts ?? [];
  const [lead, ...rest] = prompts;
  const [, second, ...morePhotos] = photos;
  const shared = sharedSentence(p);
  const compat = p.compatibility && "items" in p.compatibility ? (p.compatibility as CompatResult) : null;
  const aligned = compat?.items.filter((i) => i.status === "aligned" && i.key !== "interests").slice(0, 3) ?? [];

  const respond = (d: DetailTarget) =>
    onRespond && (
      <button type="button" onClick={() => onRespond(d)} className="inline-flex items-center gap-1.5 rounded-full border border-plum/25 px-3.5 py-1.5 text-sm font-semibold text-plum transition hover:border-plum hover:bg-plum-50">
        <Icon name="chat" className="h-4 w-4" /> Respond
      </button>
    );

  return (
    <article aria-label={`${p.displayName}'s profile`} className="space-y-10 sm:space-y-14">
      {/* A. Opening photograph with only the essentials */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end">
        <PhotoCarousel
          photos={photos}
          name={p.displayName}
          className="aspect-[4/5] w-full"
          overlay={
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent px-6 pb-6 pt-28 text-ivory">
              {p.isDemo && <span className="mb-2 inline-block rounded-full bg-ivory/90 px-2.5 py-0.5 text-[0.7rem] font-semibold text-ink">Demo profile</span>}
              <h2 className="font-serif text-4xl leading-none text-ivory sm:text-5xl">
                {p.displayName}
                {p.age != null && <span className="font-normal">, {p.age}</span>}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ivory/90">
                <Icon name="location" className="h-4 w-4" />
                {[p.city, p.distance].filter(Boolean).join(" · ") || "Location hidden"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <IntentionBadges intentions={p.intentions} />
              </div>
            </div>
          }
        />
        <div className="space-y-6">
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
          {p.bio && <p className="text-lg leading-relaxed text-ink-soft">{p.bio}</p>}
          <p className="text-sm text-ink-muted">
            {genderLabel(p.gender)}
            {p.languages.length > 0 && <> · Speaks {p.languages.join(", ")}</>}
          </p>
          {shared && <p className="rounded-2xl bg-sage/70 px-4 py-3 text-sm font-semibold text-sage-ink">{shared}</p>}
        </div>
      </div>

      {/* B. Their words, given room */}
      {lead && <PromptBlock text={lead.text} answer={lead.answer} size="lg" action={respond({ kind: "PROMPT", ref: lead.key, label: lead.text, quote: lead.answer })} />}

      {/* C. Photography as storytelling */}
      {second && <Photo id={second.id} focus={second} alt={`Another photo of ${p.displayName}`} className="aspect-[4/5] w-full sm:aspect-[16/10]" rounded="rounded-[2rem]" />}

      {/* E. Their world, with genuine overlaps called out */}
      {p.interests.length > 0 && (
        <section aria-labelledby="interests-h" className="grid gap-6 rounded-[2rem] border hairline bg-white/70 p-6 sm:grid-cols-[14rem_1fr] sm:p-8">
          <div>
            <h3 id="interests-h" className="font-serif text-2xl">
              {p.displayName}'s world
            </h3>
            {p.sharedInterestCount > 0 && <p className="mt-1 text-sm text-ink-muted">{p.sharedInterestCount} in common with you</p>}
          </div>
          <ul className="flex flex-wrap content-start gap-2">
            {p.interests.map((i) => (
              <li key={i.slug}>
                <button
                  type="button"
                  disabled={!onRespond}
                  onClick={() => onRespond?.({ kind: "INTEREST", ref: i.slug, label: "Interest", quote: i.name })}
                  className={cx("rounded-full px-3.5 py-1.5 text-sm transition disabled:cursor-default", i.shared ? "bg-plum text-ivory" : "border hairline bg-white text-ink-soft", onRespond && "hover:-translate-y-0.5 hover:shadow-soft")}
                  aria-label={onRespond ? `Respond about ${i.name}${i.shared ? " (shared)" : ""}` : undefined}
                >
                  {i.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* More of their words, in a looser rhythm */}
      {rest.length > 0 && (
        <div className={cx("grid gap-6", rest.length > 1 ? "md:grid-cols-2" : "md:ml-auto md:w-2/3")}>
          {rest.map((pr, k) => (
            <Fragment key={pr.key}>
              <PromptBlock text={pr.text} answer={pr.answer} tone={k % 2 ? "rose" : "lavender"} action={respond({ kind: "PROMPT", ref: pr.key, label: pr.text, quote: pr.answer })} />
            </Fragment>
          ))}
        </div>
      )}

      {morePhotos.length > 0 && (
        <div className={cx("grid gap-4", morePhotos.length > 1 && "sm:grid-cols-2")}>
          {morePhotos.map((ph, k) => (
            <Photo key={ph.id} id={ph.id} focus={ph} alt={`Photo ${k + 3} of ${p.displayName}`} className={cx("w-full", morePhotos.length === 1 ? "aspect-[4/5] sm:aspect-[16/10]" : "aspect-[4/5]")} rounded="rounded-[2rem]" />
          ))}
        </div>
      )}

      {/* F. Compatibility, only when it was actually calculated */}
      {compat &&
        (compat.score === null ? (
          <p className="rounded-3xl border border-dashed border-plum/30 p-5 text-sm text-ink-soft">
            There isn't enough shared information to compare yet.{" "}
            {!preview && (
              <Link to="/app/compatibility" className="font-semibold text-plum">
                Answer a few questions
              </Link>
            )}
          </p>
        ) : (
          <section aria-labelledby="insight-h" className="space-y-5">
            <h3 id="insight-h" className="font-serif text-2xl">
              Where you line up
            </h3>
            {aligned.length > 0 && (
              <ul className="space-y-1.5 text-ink-soft">
                {aligned.map((a) => (
                  <li key={a.key} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-sage-ink" /> {a.label}
                  </li>
                ))}
              </ul>
            )}
            <CompatibilityBreakdown result={compat} otherName={p.displayName} />
            {!preview && <AiPanel title="Explain this in plain words" request={{ feature: "explain_compatibility", userId: p.id }} />}
          </section>
        ))}

      {/* G. A natural next step */}
      {actions && (
        <section aria-label="Next step" className="rounded-[2rem] bg-ivory-deep/70 p-6 text-center sm:p-10">
          <p className="font-serif text-2xl">Something here you'd like to ask {p.displayName} about?</p>
          <p className="mt-1 text-sm text-ink-muted">Respond to a detail above, or simply like their profile.</p>
          <div className="mt-6">{actions}</div>
        </section>
      )}
    </article>
  );
}

function PromptBlock({ text, answer, action, size = "md", tone }: { text: string; answer: string; action?: ReactNode; size?: "md" | "lg"; tone?: "lavender" | "rose" }) {
  return (
    <section className={cx("rounded-[2rem]", size === "lg" ? "px-1 py-2 sm:px-8" : "p-6 sm:p-8", tone === "lavender" && "bg-lavender-soft/70", tone === "rose" && "bg-rose-soft/70")}>
      <p className="text-sm font-semibold text-ink-muted">{text}</p>
      <p className={cx("mt-3 font-serif leading-snug text-ink", size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl")}>{answer}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
