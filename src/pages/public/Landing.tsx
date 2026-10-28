import { Link } from "react-router-dom";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { INTENTIONS } from "../../lib/labels";

const INTENTION_IMAGES: Record<string, { src: string; alt: string }> = {
  SINGLE: { src: "/images/friends.jpg", alt: "Friends with arms around each other watching a sunset on a hillside" },
  SITUATIONSHIP: { src: "/images/hands.jpg", alt: "Two hands forming a heart shape against an evening sky" },
  MARRIAGE: { src: "/images/chairs.jpg", alt: "Two garden chairs decorated with flowers beside a lake" },
};

export function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 pb-20 pt-10 md:grid-cols-[1.05fr_1fr] md:pt-16 lg:gap-16">
          <div className="animate-rise">
            <p className="eyebrow">Dating with intention · 18+</p>
            <h1 className="mt-5 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">
              Find your <em className="font-normal italic text-plum">kind</em> of connection.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              Knot starts with what you're actually looking for — something casual, something open, or something for life — and introduces you to people who want the same.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/signup" size="lg">
                Create your profile
              </ButtonLink>
              <ButtonLink to="/how-it-works" size="lg" variant="secondary">
                See how it works
              </ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              {["No public swipe counts", "Exact location never shown", "Block & report in two taps"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-sage-ink" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroComposition />
        </div>
      </section>

      {/* What makes Knot different */}
      <section aria-labelledby="different" className="border-y hairline bg-white/50">
        <div className="container-page py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Why Knot</p>
            <h2 id="different" className="mt-3 text-4xl sm:text-5xl">
              Less guessing. More honest beginnings.
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-4xl border hairline bg-[#EADFD4] md:grid-cols-3">
            {[
              { n: "01", t: "Intention comes first", d: "Everyone says what they're open to before they say hello. You only see people whose intentions overlap with yours." },
              { n: "02", t: "Compatibility you can read", d: "Scores are built from answers you chose to share, with every factor explained — including the questions one of you skipped." },
              { n: "03", t: "Conversation over volume", d: "Mutual likes only, curated games for real conversations, and no fake notifications nudging you to keep scrolling." },
            ].map((x) => (
              <div key={x.n} className="bg-ivory p-8 lg:p-10">
                <p className="font-serif text-sm text-gold-ink">{x.n}</p>
                <h3 className="mt-4 text-2xl">{x.t}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intentions */}
      <section aria-labelledby="intentions" className="container-page py-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="eyebrow">Three intentions</p>
            <h2 id="intentions" className="mt-3 text-4xl sm:text-5xl">
              Say what you want. Change it whenever.
            </h2>
          </div>
          <Link to="/intentions" className="inline-flex items-center gap-2 font-semibold text-plum hover:gap-3 transition-all">
            Read more about intentions <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {INTENTIONS.map((i, idx) => (
            <article key={i.value} className="group overflow-hidden rounded-4xl border hairline bg-white/70 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={INTENTION_IMAGES[i.value].src} alt={INTENTION_IMAGES[i.value].alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
              </div>
              <div className="p-7">
                <span className={["inline-block rounded-full px-3 py-1 text-xs font-semibold", idx === 0 ? "bg-sage text-sage-ink" : idx === 1 ? "bg-rose-soft text-rose-ink" : "bg-lavender-soft text-plum-700"].join(" ")}>{i.short}</span>
                <h3 className="mt-4 text-2xl">{i.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{i.description}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-muted">You can choose more than one. Your intention is a preference you control — never a label on your account.</p>
      </section>

      {/* Product preview */}
      <section aria-labelledby="inside" className="bg-plum text-ivory">
        <div className="container-page grid gap-14 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Inside Knot</p>
            <h2 id="inside" className="mt-3 text-4xl text-ivory sm:text-5xl">
              Match, talk, and actually get to know each other.
            </h2>
            <dl className="mt-10 space-y-7">
              {[
                ["Matching", "Profiles show shared interests and a readable compatibility summary. A match only happens when you both say yes."],
                ["Chat", "Real-time messages with typing indicators and optional read receipts. Unmatch, block or report from any conversation."],
                ["Games", "Seven curated card games — from Red Flag or Green Flag to Deep Questions — to play alone or with a match."],
              ].map(([t, d]) => (
                <div key={t} className="border-l-2 border-gold/70 pl-5">
                  <dt className="font-serif text-xl">{t}</dt>
                  <dd className="mt-1 leading-relaxed text-ivory/75">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* Experts */}
      <section aria-labelledby="experts" className="container-page grid gap-12 py-24 md:grid-cols-2 md:items-center">
        <div className="relative order-2 md:order-1">
          <div className="overflow-hidden rounded-4xl shadow-lift">
            <img src="/images/cafe.jpg" alt="A quiet, warmly lit café with empty tables" loading="lazy" className="aspect-[5/4] w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 right-4 max-w-[17rem] rounded-3xl border hairline bg-ivory p-5 shadow-lift sm:right-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">You choose what to share</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[["Profile summary", true], ["Relationship intentions", true], ["Private chats", false]].map(([l, on]) => (
                <li key={l as string} className="flex items-center justify-between gap-3">
                  <span className={on ? "text-ink" : "text-ink-muted line-through"}>{l}</span>
                  <span className={on ? "text-sage-ink" : "text-ink-muted"}>{on ? "Shared" : "Never"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow">Compatibility Experts</p>
          <h2 id="experts" className="mt-3 text-4xl sm:text-5xl">
            A thoughtful second opinion, only when you ask.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Approved relationship coaches can review what you choose to share and offer reflections. It's entirely optional — matching and chat never wait for an expert, and a review is guidance, not a verdict on anyone.
          </p>
          <p className="mt-4 text-sm text-ink-muted">Experts are vetted by our team. We only call credentials “verified” after we've checked them.</p>
        </div>
      </section>

      {/* Safety */}
      <section aria-labelledby="safety" className="bg-sage/60">
        <div className="container-page py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-sage-ink">Safety & privacy</p>
            <h2 id="safety" className="mt-3 text-4xl sm:text-5xl">
              Built so you feel in control.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Approximate location", "Others see a distance range, never your exact location or birth date."],
              ["Block & report", "From any profile or message. Blocking ends the match and hides you both instantly."],
              ["Pause anytime", "Step out of Discover without losing your matches, or delete your account completely."],
              ["AI that respects you", "Knot AI is optional, clearly labelled, and never reads your private chats."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-3xl bg-ivory/80 p-6">
                <Icon name="shield" className="h-6 w-6 text-sage-ink" />
                <h3 className="mt-4 font-sans text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
          <Link to="/safety" className="mt-10 inline-flex items-center gap-2 font-semibold text-sage-ink hover:gap-3 transition-all">
            Our approach to safety <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-16 text-center sm:px-16">
          <svg aria-hidden="true" viewBox="0 0 400 200" className="pointer-events-none absolute inset-x-0 -top-10 mx-auto w-[44rem] max-w-none opacity-25">
            <path d="M40 120c40-90 120-90 160 0s120 90 160 0" stroke="#D4A574" strokeWidth="2" fill="none" />
            <path d="M40 80c40 90 120 90 160 0s120-90 160 0" stroke="#E0CEFA" strokeWidth="2" fill="none" />
          </svg>
          <h2 className="relative text-4xl text-ivory sm:text-5xl">Ready when you are.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-ivory/75">Creating a profile takes about five minutes. You decide what's visible before anyone sees it.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/signup" size="lg" className="bg-ivory text-plum hover:bg-white">
              Join Knot
            </ButtonLink>
            <ButtonLink to="/login" size="lg" variant="ghost" className="text-ivory hover:bg-white/10">
              I already have an account
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroComposition() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:120ms] md:max-w-none">
      <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-lavender/70 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-8 right-0 h-44 w-44 rounded-full bg-rose/80 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[2.5rem] shadow-lift">
        <img src="/images/evening.jpg" alt="A couple sitting close together on a rooftop at dusk, surrounded by candles" className="aspect-[4/5] w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent p-6 pt-24">
          <p className="font-serif text-2xl italic text-ivory">“We both wanted something real. Knot made that the first thing we knew.”</p>
          <p className="mt-2 text-xs text-ivory/70">Illustrative story — not a real testimonial</p>
        </div>
      </div>
      <div className="absolute -left-4 top-10 hidden rounded-2xl border hairline bg-ivory/95 px-4 py-3 shadow-lift sm:block">
        <p className="text-xs text-ink-muted">Looking for</p>
        <p className="font-serif text-lg text-plum">Long-term commitment</p>
      </div>
      <div className="absolute -right-3 top-1/2 hidden rounded-2xl border hairline bg-ivory/95 px-4 py-3 shadow-lift sm:block">
        <p className="text-xs text-ink-muted">You both value</p>
        <p className="text-sm font-semibold text-sage-ink">Honest communication</p>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_0.9fr]" aria-hidden="true">
      <div className="rounded-4xl bg-ivory p-4 text-ink shadow-lift">
        <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-rose to-lavender" />
        <div className="px-2 pb-2 pt-4">
          <p className="font-serif text-2xl">Meher, 27</p>
          <p className="text-sm text-ink-muted">Noida · About 15 km away</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-sage px-2.5 py-1 text-xs font-semibold text-sage-ink">Exploring</span>
            <span className="rounded-full bg-plum-50 px-2.5 py-1 text-xs font-semibold text-plum-700">Tea · shared</span>
            <span className="rounded-full bg-plum-50 px-2.5 py-1 text-xs font-semibold text-plum-700">Films · shared</span>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="flex h-11 flex-1 items-center justify-center rounded-full border border-ink/10 text-sm font-semibold">Pass</span>
            <span className="flex h-11 flex-1 items-center justify-center rounded-full bg-plum text-sm font-semibold text-ivory">Like</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="rounded-4xl bg-ivory p-5 text-ink shadow-lift">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Messages</p>
          <div className="mt-4 space-y-2.5 text-sm">
            <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-soft">What's a film you could rewatch any time?</p>
            <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-plum px-3.5 py-2.5 text-ivory">Before Sunrise. Every single time.</p>
            <p className="text-xs italic text-ink-muted">Meher is typing…</p>
          </div>
        </div>
        <div className="rounded-4xl bg-lavender p-5 text-ink shadow-lift">
          <p className="text-xs font-semibold uppercase tracking-wider text-plum-700">Would you rather?</p>
          <p className="mt-3 font-serif text-xl leading-snug">A weekend in the mountains, or a weekend by the sea?</p>
          <div className="mt-4 h-1.5 rounded-full bg-white/60">
            <div className="h-full w-2/5 rounded-full bg-plum" />
          </div>
        </div>
      </div>
    </div>
  );
}
