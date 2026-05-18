/* global React, Reveal, Section, AnnoSpec, Eyebrow, EarningsDisclaimer, Anno */
/**
 * §2 — Affiliate Marketing 101
 * Source: components/landing/sections/SectionAffiliateMarketing101.tsx
 * Event:  LP_Section_Education
 *
 * Without-vs-with side-by-side + Hulu example with FTC disclaimer.
 * Note: payout numbers in the Hulu example are derived from
 * brand-wall-data.ts (Hulu $1.60/signup) — keeping the v6 voice text but
 * confirm the math when refreshing copy.
 */
function SectionAffiliateMarketing101() {
  return (
    <Section id="affiliate-marketing-101" n="2" name="Affiliate Marketing 101" file="sections/SectionAffiliateMarketing101.tsx" event="LP_Section_Education">
      <Reveal>
        <Eyebrow>Affiliate Marketing 101</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
          You’re already recommending stuff. The brands already pay for it. We just complete the circuit.
        </h2>
      </Reveal>

      <Reveal as="div" className="mt-8 space-y-6 text-base leading-7 text-navy-700 max-w-3xl">
        <p>
          Affiliate marketing is when a brand pays you a percentage every time someone buys from them through your tracked link.
          It’s not new. It’s how thousands of bloggers, podcasters, and YouTubers have quietly earned for the last twenty years.
          Every “link in bio” on Instagram, every “use code MOM10 at checkout,” every podcast host saying “our sponsor today is…”
          — that’s affiliate marketing.
        </p>
        <p>
          Brands set the budgets aside specifically for this. If nobody uses a tracked link when they sign up, the brand just keeps
          that money. You weren’t taking it from anyone — you were the missing piece that completes a financial loop that was already designed.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Without */}
        <Reveal dir="left" className="relative">
          <div className="rounded-2xl bg-navy-50 p-6 ring-1 ring-navy-200">
            <Eyebrow tone="navy">Without MomFluence</Eyebrow>
            <h3 className="mt-2 text-xl text-navy-900 font-display font-bold">Mom recommends. Brand keeps 100%.</h3>
            <ul className="mt-4 space-y-3 text-sm text-navy-700">
              {[
                "Mom texts friend: “You need to try Hulu”",
                "Friend signs up directly at hulu.com",
                "Hulu collects the subscription fee",
              ].map((line) => (
                <li key={line} className="flex gap-2"><span className="text-navy-400">→</span><span>{line}</span></li>
              ))}
              <li className="flex gap-2"><span className="text-navy-400">→</span><span className="font-semibold text-navy-900">Mom gets nothing.</span></li>
            </ul>
          </div>
          <Anno side="right">cool tone · bg-navy-50</Anno>
        </Reveal>

        {/* With */}
        <Reveal dir="right" delay={100} className="relative">
          <div className="rounded-2xl bg-coral-50 p-6 ring-2 ring-coral-200">
            <Eyebrow>With MomFluence</Eyebrow>
            <h3 className="mt-2 text-xl text-navy-900 font-display font-bold">Mom recommends. Brand shares.</h3>
            <ul className="mt-4 space-y-3 text-sm text-navy-700">
              {[
                "Mom texts friend: “You need to try Hulu” — with her tracked link",
                "Friend taps the link and signs up",
                "Hulu pays a commission to MomFluence; we split it with Mom",
              ].map((line) => (
                <li key={line} className="flex gap-2"><span className="text-coral-500">→</span><span>{line}</span></li>
              ))}
              <li className="flex gap-2">
                <span className="text-coral-500">→</span>
                <span className="font-semibold text-navy-900">Mom earns every month her friend stays subscribed.</span>
              </li>
            </ul>
          </div>
          <Anno side="right">warm tone · ring-2 ring-coral-200 (open state)</Anno>
        </Reveal>
      </div>

      {/* Animated flow diagram slot */}
      <Reveal className="mt-8">
        <div className="rounded-2xl border border-dashed border-coral-200 bg-white p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Eyebrow>Animated flow diagram · TO BUILD</Eyebrow>
              <p className="mt-1 text-sm text-navy-700 max-w-xl">
                Lottie/SVG: 3 nodes (Mom · Friend · Brand $$). Stage A loops without link → arrow dead-ends. Stage B with link → coin animates back to Mom. Loop ~6s.
              </p>
            </div>
            <code className="text-[10px] text-navy-500 font-mono">/public/lp-baseline/diagrams/affiliate-circuit.lottie.json</code>
          </div>
        </div>
      </Reveal>

      {/* Real example */}
      <Reveal className="mt-10">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-navy-100 relative">
          <Eyebrow>Real example</Eyebrow>
          <h3 className="mt-2 text-xl text-navy-900 font-display font-bold">Mom shares Hulu with five friends in her group chat.</h3>
          <div className="mt-4 grid gap-4 text-sm text-navy-700 sm:grid-cols-3">
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-xs uppercase tracking-widest text-navy-500">If 5 friends sign up</p>
              <p className="mt-1 text-2xl font-semibold text-navy-900">$8/mo</p>
              <p className="mt-1 text-xs text-navy-600">recurring, while they stay subscribed</p>
            </div>
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-xs uppercase tracking-widest text-navy-500">Over 12 months</p>
              <p className="mt-1 text-2xl font-semibold text-navy-900">~$96</p>
              <p className="mt-1 text-xs text-navy-600">from one group text</p>
            </div>
            <div className="rounded-lg bg-coral-50 p-4 ring-1 ring-coral-200">
              <p className="text-xs uppercase tracking-widest text-coral-600">Your effort</p>
              <p className="mt-1 text-2xl font-semibold text-navy-900">One text</p>
              <p className="mt-1 text-xs text-navy-600">that you probably would have sent anyway</p>
            </div>
          </div>
          <EarningsDisclaimer density="full" className="mt-4" />
          <Anno side="right">FTC: density="full" required adjacent to earnings claims</Anno>
        </div>
      </Reveal>

      <AnnoSpec rows={[
        ["Card pair",    <>Left: <span className="tok">bg-navy-50 · ring-1 ring-navy-200</span> · Right: <span className="tok-coral tok">bg-coral-50 · ring-2 ring-coral-200</span></>],
        ["Animation",    <>Left slides in <span className="tok">x: -16 → 0</span> · Right <span className="tok">x: 16 → 0, delay 0.1s</span> · both <span className="tok">duration: 0.4 easeOut</span></>],
        ["Asset slot",   <>Animated flow diagram · <code>affiliate-circuit.lottie.json</code> · spec in <code>asset-spec.html</code></>],
        ["FTC",          <><code>EarningsDisclaimerInline density="full"</code> required adjacent to the $8/mo + $96 figures</>],
        ["Voice lock",   <>v6 phrasing audit: “complete the circuit”, “you weren’t taking it from anyone”, “missing piece” — <span className="tok-coral tok">DO NOT REWRITE</span></>],
      ]} />
    </Section>
  );
}

window.SectionAffiliateMarketing101 = SectionAffiliateMarketing101;
