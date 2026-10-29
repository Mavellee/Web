import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../../../components/ui/Button";
import { Icon, type IconName } from "../../../components/ui/Icon";
import { cx } from "../../../lib/format";

export function SectionHeader({ eyebrow, title, children, id, align = "left" }: { eyebrow: string; title: ReactNode; children?: ReactNode; id: string; align?: "left" | "center" }) {
  return (
    <div className={cx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-4 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
        {title}
      </h2>
      {children && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{children}</p>}
    </div>
  );
}

const INTENTION_CARDS = [
  {
    slug: "single",
    label: "Single",
    title: "Exploring connections",
    copy: "Open to meeting people and seeing where it goes, without needing to define it yet.",
    image: "/images/friends.jpg",
    alt: "Friends with arms around each other watching a sunset on a hillside",
    surface: "bg-sage/70",
    chip: "bg-ivory text-sage-ink",
  },
  {
    slug: "situationship",
    label: "Situationship",
    title: "Casual or undefined",
    copy: "Something lighter or still unlabelled — with honesty about what it is and isn't.",
    image: "/images/hands.jpg",
    alt: "Two hands forming a heart shape against an evening sky",
    surface: "bg-rose-soft",
    chip: "bg-ivory text-rose-ink",
  },
  {
    slug: "marriage",
    label: "Marriage",
    title: "Long-term commitment",
    copy: "Ready to talk about values, family and a shared future with someone who is too.",
    image: "/images/chairs.jpg",
    alt: "Two garden chairs decorated with flowers beside a lake",
    surface: "bg-lavender-soft",
    chip: "bg-ivory text-plum-700",
  },
];

export function IntentionsSection() {
  return (
    <section aria-labelledby="intentions-title" className="container-page py-24">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <SectionHeader id="intentions-title" eyebrow="Three intentions" title="Every kind of connection is valid.">
          Choose one or more. You'll only meet people whose intentions overlap with yours — and you can change yours whenever life does.
        </SectionHeader>
      </div>
      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {INTENTION_CARDS.map((c, i) => (
          <li key={c.slug} className={cx(i === 1 && "md:mt-10")}>
            <Link
              to={`/intentions#${c.slug}`}
              className={cx("group flex h-full flex-col overflow-hidden rounded-[2rem] transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1", c.surface)}
            >
              <div className="relative m-3 mb-0 aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                <img src={c.image} alt={c.alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                <span className={cx("absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold", c.chip)}>{c.label}</span>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="text-2xl">{c.title}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{c.copy}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  Learn about {c.label.toLowerCase()} <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS: { title: string; copy: string; icon: IconName; vignette: ReactNode }[] = [
  {
    title: "Build your profile",
    copy: "Photos, a few honest lines, your intentions and who you'd like to meet. Preview it before anyone sees it.",
    icon: "user",
    vignette: (
      <div className="flex items-center gap-3">
        <img src="/images/people/p7.jpg" alt="" className="h-12 w-12 rounded-full object-cover object-top" />
        <div className="flex-1">
          <div className="h-2 w-3/4 rounded-full bg-plum/70" />
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full w-4/5 rounded-full bg-sage-ink" />
          </div>
          <p className="mt-1 text-[0.65rem] text-ink-muted">Profile 80% complete</p>
        </div>
      </div>
    ),
  },
  {
    title: "Discover compatible people",
    copy: "See people whose preferences fit yours in both directions, with shared interests and a readable compatibility summary.",
    icon: "discover",
    vignette: (
      <div className="flex flex-wrap gap-1.5">
        {["Coffee · shared", "Hiking · shared", "Long-term", "Films"].map((t, i) => (
          <span key={t} className={cx("rounded-full px-2.5 py-1 text-[0.7rem] font-semibold", i < 2 ? "bg-plum-50 text-plum-700" : "bg-ink/5 text-ink-soft")}>
            {t}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "Connect through mutual interest",
    copy: "Likes stay private. A match — and a conversation — only opens when you both say yes.",
    icon: "heart",
    vignette: (
      <div className="flex items-center">
        <img src="/images/people/p4.jpg" alt="" className="h-11 w-11 rounded-full border-2 border-ivory object-cover object-top" />
        <img src="/images/people/p12.jpg" alt="" className="-ml-3 h-11 w-11 rounded-full border-2 border-ivory object-cover object-top" />
        <span className="ml-3 text-sm font-semibold text-plum">It's mutual</span>
      </div>
    ),
  },
  {
    title: "Get to know each other",
    copy: "Talk in real time, and when you'd like a nudge, play a question game together — no pressure, skip anything.",
    icon: "chat",
    vignette: (
      <div className="space-y-1.5 text-[0.75rem]">
        <p className="w-fit rounded-2xl rounded-bl-md bg-white px-3 py-1.5 shadow-soft">Mountains or the sea?</p>
        <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-plum px-3 py-1.5 text-ivory">Sea. Always the sea.</p>
      </div>
    ),
  },
];

export function JourneySection() {
  return (
    <section aria-labelledby="journey-title" className="border-y hairline bg-white/55">
      <div className="container-page py-24">
        <SectionHeader id="journey-title" eyebrow="How Knot works" title="From first impression to real conversation." />
        <ol className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-plum-200 to-transparent lg:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border hairline bg-ivory font-serif text-lg text-plum">{i + 1}</span>
                <Icon name={s.icon} className="h-5 w-5 text-ink-muted" />
              </div>
              <h3 className="mt-6 text-xl">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{s.copy}</p>
              <div aria-hidden="true" className="mt-5 rounded-2xl border hairline bg-ivory p-4">
                {s.vignette}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ExpertsSection() {
  return (
    <section aria-labelledby="experts-title" className="container-page grid gap-14 py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div>
        <SectionHeader id="experts-title" eyebrow="Compatibility Experts · optional" title="A thoughtful second opinion, when you ask for one.">
          Vetted relationship coaches can help you reflect on what you're looking for or how you and a match might communicate — using only the details you choose to share.
        </SectionHeader>
        <ul className="mt-8 space-y-3 text-ink-soft">
          {["Guidance to reflect on, never a verdict or a guarantee", "Matching and chat never wait for an expert", "Credentials are marked verified only after we've checked them"].map((t) => (
            <li key={t} className="flex gap-3">
              <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-sage-ink" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative">
        <img src="/images/cafe.jpg" alt="A quiet, warmly lit café with empty tables" loading="lazy" className="aspect-[5/4] w-full rounded-[2rem] object-cover" />
        <div className="absolute -bottom-8 left-4 right-4 rounded-3xl border hairline bg-ivory p-5 shadow-lift sm:left-auto sm:right-6 sm:w-72">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">You decide what's shared</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["Profile summary", "Shared", "text-sage-ink"],
              ["Relationship intentions", "Shared", "text-sage-ink"],
              ["Compatibility answers", "Not shared", "text-ink-muted"],
              ["Private messages", "Never", "text-rose-ink"],
            ].map(([l, v, c]) => (
              <li key={l} className="flex justify-between gap-3">
                <span>{l}</span>
                <span className={cx("font-semibold", c)}>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Prompts quoted from the curated decks seeded into the database.
const GAME_SAMPLES = [
  { deck: "Would You Rather?", prompt: "A weekend in the mountains, or a weekend by the sea?", tone: "bg-sage", rotate: "-rotate-3" },
  { deck: "Deep Questions", prompt: "When do you feel most like yourself?", tone: "bg-lavender", rotate: "rotate-2" },
  { deck: "Red Flag or Green Flag?", prompt: "They remember a small detail you mentioned weeks ago.", tone: "bg-rose", rotate: "-rotate-1" },
];

export function GamesSection() {
  return (
    <section aria-labelledby="games-title" className="bg-ink text-ivory">
      <div className="container-page grid gap-16 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Games & conversation</p>
          <h2 id="games-title" className="mt-4 text-[2rem] leading-[1.1] text-ivory sm:text-[2.6rem]">
            Better questions than “hey, how's your week?”
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ivory/75">
            Seven curated decks for after you match — playful, thoughtful, or somewhere in between. Answer, reveal together, skip anything, end whenever.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {["Red Flag or Green Flag", "How Well Do You Know Each Other", "Deep Questions", "Would You Rather", "Loyalty & Boundaries", "Love Languages", "Fun Challenges"].map((d) => (
              <li key={d} className="rounded-full border border-ivory/20 px-3 py-1.5 text-sm text-ivory/85">
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div aria-label="Example prompts from Knot games" className="relative mx-auto grid w-full max-w-md gap-4 sm:max-w-none sm:grid-cols-3 sm:gap-3 sm:pt-6">
          {GAME_SAMPLES.map((g, i) => (
            <article key={g.deck} className={cx("rounded-[1.75rem] p-6 text-ink shadow-lift transition duration-300 hover:rotate-0 sm:min-h-72", g.tone, g.rotate, i === 1 && "sm:-mt-6")}>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/60">{g.deck}</p>
              <p className="mt-6 font-serif text-xl leading-snug">{g.prompt}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const SAFETY: { icon: IconName; title: string; copy: string }[] = [
  { icon: "heart", title: "Mutual matching", copy: "No one can message you unless you've both said yes." },
  { icon: "lock", title: "Privacy controls", copy: "Pause Discover, hide distance, turn off read receipts, download or delete your data." },
  { icon: "shield", title: "Block anytime", copy: "Blocking ends the match and hides you from each other — they aren't notified." },
  { icon: "flag", title: "Report in two taps", copy: "Report a profile or a single message. Reports are confidential and reviewed by people." },
  { icon: "eye", title: "Your choice, always", copy: "AI suggestions and expert reviews are optional, clearly labelled, and never read your chats." },
];

export function SafetySection() {
  return (
    <section aria-labelledby="safety-title" className="container-page py-24">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeader id="safety-title" eyebrow="Safety & trust" title="You stay in control.">
          Safety on Knot isn't a settings page you find later. It's in every profile, match and conversation.
        </SectionHeader>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {SAFETY.map((s) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-sage-ink">
                <Icon name={s.icon} />
              </span>
              <div>
                <h3 className="font-sans text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{s.copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Link to="/safety" className="mt-12 inline-flex items-center gap-2 font-semibold text-plum transition-all hover:gap-3">
        Read our approach to safety <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="container-page pb-24">
      <div className="grid overflow-hidden rounded-[2.5rem] bg-plum text-ivory md:grid-cols-[1.2fr_1fr]">
        <div className="p-10 sm:p-14">
          <h2 className="text-[2rem] leading-tight text-ivory sm:text-[2.6rem]">Start with what you're looking for.</h2>
          <p className="mt-4 max-w-md text-ivory/80">It takes about five minutes to create a profile, and nothing is visible until you choose to publish it.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/signup" size="lg" className="bg-ivory !text-plum hover:bg-white">
              Find your connection
            </ButtonLink>
            <ButtonLink to="/login" size="lg" variant="ghost" className="!text-ivory hover:bg-white/10">
              Log in
            </ButtonLink>
          </div>
        </div>
        <img src="/images/evening.jpg" alt="A couple sitting close together on a rooftop at dusk, surrounded by candles" loading="lazy" className="h-64 w-full object-cover md:h-full" />
      </div>
    </section>
  );
}
