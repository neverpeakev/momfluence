/* global React, Reveal, Section, AnnoSpec, Eyebrow, EarningsDisclaimer, Anno */
/**
 * §3.5 — Earnings Calculator (NEW · approved in scoping)
 *
 * Interactive trust-builder. Two sliders:
 *   • Friends I'll share with (1–50)
 *   • Average $/signup × month (3–15 — anchored to streaming + recurring mix)
 * Plus a $25 fast-track callout.
 *
 * Engineering note: ship as <SectionEarningsCalculator /> with the same
 * Framer Motion entrance + LPSectionTracker wrapping. Fire
 * LP_EarningsCalc_Engaged on first interaction.
 *
 * FTC: every number on this card sits next to a density="full" disclaimer.
 */
const { useMemo, useState } = React;

function SectionEarningsCalculator() {
  const [friends, setFriends] = useState(8);
  const [perFriend, setPerFriend] = useState(7);
  const monthly = friends * perFriend;
  const annual = monthly * 12;
  const fastTrack = 25;

  return (
    <Section id="earnings-calculator" n="3.5" name="Earnings calculator" file="sections/SectionEarningsCalculator.tsx [NEW]" event="LP_Section_EarningsCalc">
      <Reveal>
        <Eyebrow>Math, not magic</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
          Slide it. See what your group chat is worth.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          Drag the sliders below. The math is the same math an affiliate manager uses —
          we just made it touch-friendly. Numbers are illustrative; your mileage depends
          on which brands you share and how often.
        </p>
      </Reveal>

      <Reveal className="mt-10">
        <div className="rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-navy-100 relative shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            {/* Sliders */}
            <div className="space-y-7">
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="calc-friends" className="text-sm font-semibold text-navy-800">Friends who sign up</label>
                  <span className="text-2xl font-display font-bold text-navy-900">{friends}</span>
                </div>
                <input id="calc-friends" type="range" min={1} max={50} value={friends}
                  onChange={(e) => setFriends(+e.target.value)} className="calc-slider mt-2" />
                <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-navy-400 font-semibold">
                  <span>1</span><span>10</span><span>25</span><span>50</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="calc-per" className="text-sm font-semibold text-navy-800">Average $/friend per month</label>
                  <span className="text-2xl font-display font-bold text-navy-900">${perFriend}</span>
                </div>
                <input id="calc-per" type="range" min={3} max={15} value={perFriend}
                  onChange={(e) => setPerFriend(+e.target.value)} className="calc-slider mt-2" />
                <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-navy-400 font-semibold">
                  <span>$3 (streaming heavy)</span><span>$9 (mixed)</span><span>$15 (high-payout brands)</span>
                </div>
              </div>

              <div className="rounded-xl bg-coral-50 p-4 ring-1 ring-coral-200 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">Fast-track</p>
                  <p className="mt-0.5 text-sm text-navy-700">Your first <span className="font-semibold text-navy-900">$25</span> lands same-day so you can verify.</p>
                </div>
                <p className="text-2xl font-display font-bold text-coral-700">+${fastTrack}</p>
              </div>
            </div>

            {/* Result panel */}
            <div className="lg:w-80">
              <div className="rounded-2xl bg-navy-900 p-6 text-white shadow-xl relative">
                <p className="text-xs uppercase tracking-widest text-coral-300 font-semibold">Estimated recurring</p>
                <p className="mt-2 text-5xl font-display font-bold leading-none tracking-tight">
                  ${monthly.toLocaleString()}
                  <span className="text-xl text-navy-200 font-sans font-medium align-baseline">/mo</span>
                </p>
                <div className="mt-5 h-px bg-navy-700" />
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-sm text-navy-200">Over 12 months</span>
                  <span className="text-2xl font-display font-bold">~${annual.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm text-navy-200">Membership cost</span>
                  <span className="text-sm text-navy-100">$60/yr</span>
                </div>
                <div className="mt-4 rounded-lg bg-coral-500/15 px-3 py-2 ring-1 ring-coral-400/30">
                  <p className="text-[11px] uppercase tracking-widest text-coral-200 font-semibold">Net</p>
                  <p className="mt-0.5 text-xl font-display font-bold text-coral-200">
                    ~${(annual - 60).toLocaleString()} after $5/mo
                  </p>
                </div>
                <Anno side="bottom-right">live value · fires LP_EarningsCalc_Engaged on first drag</Anno>
              </div>
              <EarningsDisclaimer density="compact" className="mt-3 text-center" />
            </div>
          </div>
        </div>
      </Reveal>

      <EarningsDisclaimer density="full" className="mt-6" />

      <AnnoSpec rows={[
        ["Status",      <><span className="tok-coral tok">NEW · approved in scoping</span> · ship as <code>SectionEarningsCalculator.tsx</code> · placed between §3 and §4</>],
        ["Event",       <><code>LP_EarningsCalc_Engaged</code> fires once on first slider change · also <code>LP_Section_EarningsCalc</code> on scroll-in</>],
        ["Defaults",    <>friends = 8 · perFriend = $7 · monthly $56 · annual $672 — tuned to land near the upper-end of §8 FAQ’s “$15–$75 first month” claim</>],
        ["Slider",      <>Custom thumb · <span className="tok-coral tok">bg-coral-500</span> with <span className="tok">0 0 0 4px coral-500/12 halo</span> · 22×22 px hit area mobile</>],
        ["Result panel",<><span className="tok">bg-navy-900</span> · matches Closing CTA dark surface to set up §9 visually</>],
        ["FTC",         <>Compact disclaimer below the result · density="full" below the whole card · numbers explicitly framed as illustrative in copy</>],
      ]} />
    </Section>
  );
}

window.SectionEarningsCalculator = SectionEarningsCalculator;
