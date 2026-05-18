/* global React, Reveal, Section, AnnoSpec, Eyebrow, EarningsDisclaimer, AssetSlot, Anno */
/**
 * §6 — Social proof (Phase 1: founder-led)
 * Source: components/landing/sections/SectionSocialProof.tsx
 * Event:  LP_Section_SocialProof
 *
 * Phase 1 ships honest founder content: Kevin (founder) + Kelly (real
 * first paying member, founder's wife). No fabrication.
 *
 * Phase 2 (T+14 days): 5 real founding moms — photos, first names,
 * earnings, channels they share through. Pattern derived from the v1
 * creator-signup page social-photo cluster (dub.co/partners aesthetic,
 * mom-voice copy).
 */
const PHASE2_SLOTS = [
  { id: "p2-1", name: "Mom #1",  earnings: "$—", channels: "—" },
  { id: "p2-2", name: "Mom #2",  earnings: "$—", channels: "—" },
  { id: "p2-3", name: "Mom #3",  earnings: "$—", channels: "—" },
  { id: "p2-4", name: "Mom #4",  earnings: "$—", channels: "—" },
  { id: "p2-5", name: "Mom #5",  earnings: "$—", channels: "—" },
];

function FounderAvatar({ initials, ring = "bg-navy-200", size = 64 }) {
  // Placeholder until real headshot drops into /public/lp-baseline/founders/
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${ring} text-navy-700 font-display font-bold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
      <span className="absolute -bottom-1 -right-1 inline-block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
    </div>
  );
}

function SectionSocialProof() {
  return (
    <Section id="social-proof" n="6" name="Social proof" file="sections/SectionSocialProof.tsx" event="LP_Section_SocialProof">
      <Reveal>
        <Eyebrow>Built in public</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
          We’re early. We’re honest about it.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          MomFluence is a brand-new platform. We’re not going to pretend ten-thousand moms are already earning life-changing money.
          We’ll be that platform — but we’re building it transparently, one founding member at a time.
        </p>
      </Reveal>

      {/* Phase 1: Founder + Kelly */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Reveal dir="left">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-navy-200 h-full relative">
            <div className="flex items-start gap-4">
              <FounderAvatar initials="KN" />
              <div>
                <Eyebrow>From the founder</Eyebrow>
                <h3 className="mt-1 text-xl text-navy-900 font-display font-bold">Kevin Neal — Never Peak Inc.</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-base leading-7 text-navy-700">
              <p>
                I built MomFluence after watching my wife recommend products to her friends for fifteen years without ever earning
                a dollar from it. Every time a friend bought something she suggested, the brand kept 100% — even when the brand
                had an affiliate program specifically designed to share with people exactly like her.
              </p>
              <p>The infrastructure to fix that has existed for two decades. It just wasn’t built for moms. So we built it.</p>
              <p>
                I’m the founder, the engineer, and the person who replies to every email at{" "}
                <a href="mailto:hello@momfluence.app" className="underline">hello@momfluence.app</a>. If you sign up and don’t earn
                at least your $5 back in the first month, email me directly and I’ll personally make it right.
              </p>
            </div>
            <Anno side="bottom-right">photo slot · founders/kevin.jpg · 256×256 sq</Anno>
          </div>
        </Reveal>

        <Reveal dir="right" delay={100}>
          <div className="rounded-2xl bg-coral-50 p-6 ring-2 ring-coral-200 h-full relative">
            <div className="flex items-start gap-4">
              <FounderAvatar initials="K" ring="bg-coral-200" />
              <div>
                <Eyebrow>First member</Eyebrow>
                <h3 className="mt-1 text-xl text-navy-900 font-display font-bold">Kelly — Founding Member</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-base leading-7 text-navy-700">
              <p>
                Our very first paying member is the founder’s wife — and we’ll be honest about that. She’s also a regular mom
                with three kids, a phone, and an active group chat. She’s been quietly testing the platform from the inside since launch.
              </p>
              <p className="italic text-navy-800">
                “I’ve been the unpaid recommendation engine for our mom group for years. Now I just send the link instead of just
                the name. Nothing about how I share has changed.”
              </p>
              <p className="text-sm text-navy-600">— Kelly, on the first week of using MomFluence</p>
            </div>
            <Anno side="bottom-right">photo slot · founders/kelly.jpg · 256×256 sq</Anno>
          </div>
        </Reveal>
      </div>

      {/* Phase 2 — reserved cluster (dub.co/partners-inspired tile cluster) */}
      <div className="mt-12">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <Eyebrow tone="navy">Phase 2 · founding cohort (ships T+14 days)</Eyebrow>
          <p className="text-[11px] font-mono text-coral-700">
            data: <code>/lib/landing/social-proof-data.ts</code> (TODO)
          </p>
        </div>
        <Reveal className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {PHASE2_SLOTS.map((slot, i) => (
            <article key={slot.id} className="rounded-2xl bg-white p-3 ring-1 ring-navy-100">
              <AssetSlot label={`Mom ${i + 1}`} name="Headshot" dims="384 × 384 sq" height={140} className="rounded-xl" />
              <div className="mt-3 px-1">
                <p className="text-[10px] uppercase tracking-widest text-navy-400 font-semibold">First name</p>
                <p className="mt-0.5 text-sm font-semibold text-navy-900">{slot.name}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-widest text-coral-600 font-semibold">First month earned</p>
                <p className="mt-0.5 text-base font-display font-bold text-navy-900">{slot.earnings}</p>
                <p className="mt-2 text-[11px] text-navy-500">Shares through: {slot.channels}</p>
              </div>
            </article>
          ))}
        </Reveal>
        <p className="mt-3 text-xs text-navy-500">
          Five reserved tiles for real moms with photos, first names, first-month earnings, and the channels they share through.
          Inspiration: v1 creator-signup social-photo cluster pattern.
        </p>
      </div>

      {/* Founding members callout */}
      <Reveal className="mt-8">
        <div className="rounded-2xl bg-navy-50 p-6 ring-1 ring-navy-200">
          <Eyebrow tone="navy">For early members</Eyebrow>
          <h3 className="mt-2 text-lg text-navy-900 font-display font-bold">Founding member treatment for the first 100 signups.</h3>
          <p className="mt-3 text-sm leading-6 text-navy-700">
            We’re onboarding our first 100 founding members with extra attention — direct access to the founder, priority on new
            brand additions, and a chance to be featured (with permission) in upcoming case studies. If you sign up now and stay
            for 30 days actively sharing links, we’ll send you a personal video walkthrough of best practices.
          </p>
          <EarningsDisclaimer density="compact" className="mt-4" />
        </div>
      </Reveal>

      <Reveal className="mt-6">
        <p className="text-xs text-navy-500 max-w-3xl">
          More real-mom case studies — with photos, earnings figures, and video — coming over the next few weeks as our founding
          cohort builds up their first month of data.
        </p>
      </Reveal>

      <AnnoSpec rows={[
        ["Phase 1",     <>Kevin + Kelly · real headshots required <code>/public/lp-baseline/founders/{`{kevin,kelly}`}.jpg</code> · 256×256 sq · masked PII clean</>],
        ["Phase 2",     <>5× founding moms · ships T+14 days · data file <code>/lib/landing/social-proof-data.ts</code> · photo + first name + first-month earnings + channels</>],
        ["Phase 2 grid",<><span className="tok">grid-cols-2 sm:grid-cols-3 lg:grid-cols-5</span> · matches dub.co/partners-style cluster · empty slots stay visible as reserved tiles until photos ship</>],
        ["Voice",       <>v6 LOCKED: “regular mom with three kids” · “unpaid recommendation engine” · “Nothing about how I share has changed” · <span className="tok-coral tok">DO NOT REWRITE</span></>],
        ["Trust signal",<>Honest framing replaces fake testimonials · founder personally guarantees ($5 back) · founding-member explicit framing</>],
        ["FTC",         <>Compact disclaimer below the founding-members card · earnings claims downstream gated by individual disclosures</>],
      ]} />
    </Section>
  );
}

window.SectionSocialProof = SectionSocialProof;
