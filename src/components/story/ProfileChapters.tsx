import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { Photo } from "../ui/Photo";
import type { DetailTarget } from "./DetailComposer";
import { genderLabel, INTENTIONS, intentionLabel } from "../../lib/labels";
import { LEAD_INTERESTS } from "../../lib/profileStory";
import { sharedSentence } from "../../lib/profile";
import { cx } from "../../lib/format";
import type { MediaItem, PublicProfile } from "../../lib/types";

type Person = Omit<PublicProfile, "compatibility">;
type Respond = (d: DetailTarget) => void;

/** The first impression: one large photo and who this is, with nothing else competing for attention. */
export function ProfileHero({ p, lead, onOpen, action }: { p: Person; lead?: MediaItem; onOpen: () => void; action?: ReactNode }) {
  return (
    <header>
      <div className="relative -mx-4 sm:mx-0">
        <button type="button" onClick={onOpen} disabled={!lead} aria-label={lead ? `Open ${p.displayName}'s photos and videos` : undefined} className="block w-full overflow-hidden text-left sm:rounded-[1.75rem]">
          <Photo
            id={lead?.id}
            focus={lead}
            alt={lead?.caption ?? (lead ? `${p.displayName}'s main photo` : `${p.displayName} hasn't added a photo yet`)}
            className="aspect-[4/5] max-h-[78dvh] w-full"
            rounded="rounded-none sm:rounded-[1.75rem]"
          />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/75 to-transparent px-5 pb-6 pt-24 text-paper sm:rounded-b-[1.75rem] sm:px-8 sm:pb-8">
          {p.isDemo && <span className="mb-2 inline-block rounded-full bg-paper/90 px-2.5 py-0.5 text-[0.7rem] font-semibold text-scrim">Demo profile</span>}
          <h2 className="font-serif text-4xl leading-none text-paper sm:text-5xl">
            {p.displayName}
            {p.age != null && <span className="font-normal">, {p.age}</span>}
          </h2>
          {(p.city || p.distance) && <p className="mt-2 text-sm text-paper/90">{[p.city, p.distance].filter(Boolean).join(" · ")}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {(p.intentions.length > 0 || p.zodiac) && (
          <ul className="flex flex-wrap gap-2">
            {p.intentions.map((i, k) => (
              <li key={i} className={cx("inline-flex min-h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold", k === 0 ? "bg-primary text-paper" : "border border-primary-text/40 text-primary-text")}>
                {k === 0 && <Icon name="heart" filled className="h-3.5 w-3.5 text-gold" />}
                {intentionLabel(i)}
              </li>
            ))}
            {p.zodiac && (
              <li className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-gold/60 bg-gold-soft/60 px-3.5 text-sm font-semibold text-gold-ink">
                {p.zodiac.symbol} {p.zodiac.name}
              </li>
            )}
          </ul>
        )}
        {action}
      </div>
      {lead?.caption && <p className="mt-3 font-serif text-lg italic leading-snug text-ink-soft">{lead.caption}</p>}
    </header>
  );
}

function InterestChips({ items, onRespond }: { items: Person["interests"]; onRespond?: Respond }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li key={i.slug}>
          <button
            type="button"
            disabled={!onRespond}
            onClick={() => onRespond?.({ kind: "INTEREST", ref: i.slug, label: "Interest", quote: i.name })}
            aria-label={onRespond ? `Respond about ${i.name}${i.shared ? " (shared)" : ""}` : undefined}
            className={cx("inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition disabled:cursor-default", i.shared ? "border-primary-text/40 font-semibold text-primary-text" : "hairline text-ink-soft", onRespond && "hover:border-primary-text/60")}
          >
            {i.shared && <Icon name="check" className="h-3.5 w-3.5" />}
            {i.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AboutChapter({ p, onRespond }: { p: Person; onRespond?: Respond }) {
  const shared = sharedSentence(p);
  return (
    <section aria-label={`About ${p.displayName}`} className="space-y-4">
      {p.bio && <p className="font-serif text-2xl leading-snug text-ink sm:text-[1.75rem]">{p.bio}</p>}
      {p.interests.length > 0 && <InterestChips items={p.interests.slice(0, LEAD_INTERESTS)} onRespond={onRespond} />}
      {shared && <p className="text-sm font-semibold text-primary-text">{shared}</p>}
    </section>
  );
}

/** Prompts take turns between two treatments, so the page never repeats the same block. */
export function PromptChapter({ text, answer, variant, action }: { text: string; answer: string; variant: number; action?: ReactNode }) {
  return variant % 2 === 0 ? (
    <section className="rounded-[1.75rem] bg-rose-soft/70 px-6 py-9 sm:px-10 sm:py-12">
      <p className="text-sm font-semibold text-primary-text">{text}</p>
      <p className="mt-4 font-serif text-3xl leading-tight text-ink sm:text-4xl">{answer}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  ) : (
    <section className="border-l-2 border-gold py-1 pl-6 sm:pl-8">
      <p className="text-sm font-semibold text-ink-muted">{text}</p>
      <p className="mt-3 font-serif text-2xl italic leading-snug text-ink-soft sm:text-3xl">{answer}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

export function DetailsChapter({ p, onRespond }: { p: Person; onRespond?: Respond }) {
  const rows: [string, ReactNode][] = [
    ...(p.city ? ([["Lives in", p.city]] as [string, ReactNode][]) : []),
    ...(p.languages.length ? ([["Speaks", p.languages.join(", ")]] as [string, ReactNode][]) : []),
    ...(p.zodiac ? ([["Zodiac sign", `${p.zodiac.symbol} ${p.zodiac.name} · ${p.zodiac.element} sign`]] as [string, ReactNode][]) : []),
    ["Gender", genderLabel(p.gender)],
  ];
  const more = p.interests.slice(LEAD_INTERESTS);
  return (
    <section aria-labelledby={`details-${p.id}`}>
      <h3 id={`details-${p.id}`} className="font-serif text-2xl">
        A few more things
      </h3>
      <dl className="mt-4 divide-y divide-line border-y hairline">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-6 py-3.5">
            <dt className="text-sm text-ink-muted">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      {more.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-ink-muted">Also into</p>
          <InterestChips items={more} onRespond={onRespond} />
        </div>
      )}
    </section>
  );
}

export function LookingForChapter({ p }: { p: Person }) {
  return (
    <section aria-labelledby={`looking-${p.id}`} className="text-center">
      <p id={`looking-${p.id}`} className="eyebrow">
        What {p.displayName} is looking for
      </p>
      <ul className="mt-6 space-y-6">
        {p.intentions.map((i) => {
          const def = INTENTIONS.find((x) => x.value === i)!;
          return (
            <li key={i}>
              <p className="font-serif text-3xl leading-tight">{def.title}</p>
              <p className="mx-auto mt-2 max-w-md text-ink-muted">{def.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
