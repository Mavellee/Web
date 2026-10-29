import { useState } from "react";
import { Link } from "react-router-dom";
import { Photo } from "../ui/Photo";
import { IconButton } from "../ui/IconButton";
import { Icon } from "../ui/Icon";
import { IntentionBadges } from "./ProfileCard";
import { CompatibilityBreakdown } from "../compat/CompatibilityBreakdown";
import { AiPanel } from "../app/AiPanel";
import { genderLabel } from "../../lib/labels";
import { cx } from "../../lib/format";
import type { CompatResult, PublicProfile } from "../../lib/types";

export type DetailedProfile = PublicProfile & { compatibility: CompatResult | null };

/** Photo viewer with thumbnails; keyboard reachable previous/next controls. */
export function PhotoGallery({ ids, name, aspect = "aspect-[4/5]" }: { ids: string[]; name: string; aspect?: string }) {
  const [i, setI] = useState(0);
  if (!ids.length) return <Photo alt={name} className={cx(aspect, "w-full")} />;
  return (
    <div>
      <div className="relative">
        <Photo key={ids[i]} id={ids[i]} alt={`Photo ${i + 1} of ${ids.length} of ${name}`} className={cx(aspect, "w-full")} position="object-top" />
        {ids.length > 1 && (
          <div className="absolute inset-x-3 bottom-3 flex justify-between">
            <IconButton icon="chevronLeft" label="Previous photo" tone="soft" size="sm" disabled={i === 0} onClick={() => setI(i - 1)} />
            <IconButton icon="chevronRight" label="Next photo" tone="soft" size="sm" disabled={i === ids.length - 1} onClick={() => setI(i + 1)} />
          </div>
        )}
      </div>
      {ids.length > 1 && (
        <ul className="mt-3 flex gap-2" aria-label="Photos">
          {ids.map((id, k) => (
            <li key={id}>
              <button type="button" onClick={() => setI(k)} aria-label={`Show photo ${k + 1}`} aria-current={k === i} className={cx("block overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory transition", k === i ? "ring-2 ring-plum" : "opacity-70 hover:opacity-100")}>
                <Photo id={id} alt="" className="h-14 w-12" rounded="rounded-xl" position="object-top" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Everything about a person, for the full page and the Discover drawer. */
export function ProfileDetail({ profile, compact }: { profile: DetailedProfile; compact?: boolean }) {
  const p = profile;
  return (
    <div className={cx("grid grid-cols-1 gap-8 [&>*]:min-w-0", !compact && "lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12")}>
      <PhotoGallery ids={p.photoIds} name={p.displayName} aspect={compact ? "aspect-[5/4]" : "aspect-[4/5]"} />
      <div className="space-y-8">
        <header>
          <h2 className="text-4xl sm:text-5xl">
            {p.displayName}
            {p.age != null && <span className="font-normal text-ink-soft">, {p.age}</span>}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-ink-soft">
            <span>{genderLabel(p.gender)}</span>
            {p.city && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="location" className="h-4 w-4" />
                  {[p.city, p.distance].filter(Boolean).join(" · ")}
                </span>
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <IntentionBadges intentions={p.intentions} />
          </div>
        </header>
        {p.bio && <p className="font-serif text-xl leading-relaxed text-ink">“{p.bio}”</p>}
        <dl className="grid gap-6 sm:grid-cols-2">
          {p.interests.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Interests {p.sharedInterestCount > 0 && <span className="normal-case tracking-normal text-plum">· {p.sharedInterestCount} in common</span>}</dt>
              <dd className="mt-3 flex flex-wrap gap-1.5">
                {p.interests.map((i) => (
                  <span key={i.slug} className={cx("rounded-full px-3 py-1 text-sm", i.shared ? "bg-plum text-ivory" : "border hairline bg-white text-ink-soft")}>
                    {i.name}
                    {i.shared && <span className="sr-only"> (shared)</span>}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {p.languages.length > 0 && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Languages</dt>
              <dd className="mt-2 text-ink-soft">{p.languages.join(", ")}</dd>
            </div>
          )}
        </dl>
        {p.compatibility &&
          (p.compatibility.score === null ? (
            <div className="rounded-3xl border border-dashed border-plum/30 p-6">
              <p className="font-serif text-xl">Not enough to compare yet</p>
              <p className="mt-1 text-sm text-ink-soft">Compatibility appears once you've both answered a few of the same optional questions. Nothing is guessed.</p>
              <Link to="/app/compatibility" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-plum">
                Answer questions <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <CompatibilityBreakdown result={p.compatibility} otherName={p.displayName} />
              <AiPanel title="Explain this in plain words" request={{ feature: "explain_compatibility", userId: p.id }} />
            </>
          ))}
      </div>
    </div>
  );
}
