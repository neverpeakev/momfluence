/* global React, Reveal, Section, AnnoSpec, Eyebrow, Anno */
/**
 * §7 — Pricing A/B test (Variants B + C)
 * Source: components/landing/sections/SectionPricingABTest.tsx
 * Event:  LP_Section_Pricing · LP_Pricing_Assigned · LP_Pricing_CTAClicked
 *
 * Reads mf_pricing_variant cookie (set by LPBaseline server-side, sticky
 * 90 days). In this prototype the Tweaks panel controls which variant
 * renders so reviewers can see both. Engineering side: do not alter the
 * cookie-read logic.
 */
function VariantB() {
  return (
    <div className="rounded-3xl bg-white p-8 sm:p-10 ring-2 ring-coral-200 relative">
      <Eyebrow>$5/month — and we credit it back</Eyebrow>
      <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
        Your first $25 earned? We send you a $5 credit.
      </h2>
      <p className="mt-3 text-base leading-7 text-navy-700 max-w-3xl">
        The membership pays for itself in week one for most active sharers. Pay $5 today. The moment your cumulative earnings
        hit $25, we credit $5 back to your dashboard balance — so your effective cost is zero if you actually use it.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-coral-50 p-4 ring-1 ring-coral-200">
          <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">Today</p>
          <p className="mt-1 text-2xl font-display font-bold text-navy-900">$5.00</p>
          <p className="mt-1 text-xs text-navy-600">membership activation</p>
        </div>
        <div className="rounded-xl bg-navy-50 p-4 ring-1 ring-navy-200">
          <p className="text-xs uppercase tracking-widest text-navy-500 font-semibold">When you hit $25 earned</p>
          <p className="mt-1 text-2xl font-display font-bold text-navy-900">–$5.00</p>
          <p className="mt-1 text-xs text-navy-600">credit to your balance</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-2 ring-coral-300">
          <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">Net cost</p>
          <p className="mt-1 text-2xl font-display font-bold text-coral-700">$0.00</p>
          <p className="mt-1 text-xs text-navy-600">if you actively use the platform</p>
        </div>
      </div>

      <div className="mt-8 space-y-2 text-sm text-navy-700">
        {[
          "Full access to 22+ active brand programs from day one",
          "Cancel anytime — no contract, no minimum term",
          "Fast-track first $25 cashout lands same-day",
          "Direct access to the founder during your first month",
        ].map((line) => (
          <p key={line} className="flex items-start gap-2"><span className="text-coral-500">✓</span><span>{line}</span></p>
        ))}
      </div>

      <div className="mt-8">
        <a href="/signup?pricing_variant=B" className="btn-primary text-base">Get started — $5 back guarantee</a>
        <p className="mt-3 text-xs text-navy-500 max-w-xl">
          $5/mo billed monthly. The $5 credit applies once your cumulative earnings cross $25. See full terms at{" "}
          <a href="/terms" className="underline">/terms</a>.
        </p>
      </div>
      <Anno side="right">Variant B · cookie value &quot;B&quot;</Anno>
    </div>
  );
}

function VariantC() {
  return (
    <div className="rounded-3xl bg-white p-8 sm:p-10 ring-2 ring-navy-300 relative">
      <Eyebrow tone="navy-strong">$5/month for the door, not the deal</Eyebrow>
      <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
        The brands inside don’t accept random applicants. The $5 is what opens the door.
      </h2>
      <p className="mt-3 text-base leading-7 text-navy-700 max-w-3xl">
        Most affiliate programs make you apply, prove you have a following, and wait a week to hear back. Most moms never get
        approved. We’ve already done that work with 22+ premium brands so you skip the line. The $5/mo is your access key to a
        room you couldn’t walk into alone.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-navy-900 p-5 text-white">
          <p className="text-xs uppercase tracking-widest text-coral-300 font-semibold">Without MomFluence</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              "Apply to each brand individually",
              "Wait 1-2 weeks for each approval",
              "Most reject moms without a following",
              "Manage payments from each brand separately",
            ].map((l) => (
              <li key={l} className="flex gap-2"><span className="text-navy-400">✗</span><span>{l}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-coral-50 p-5 ring-2 ring-coral-200">
          <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">With MomFluence</p>
          <ul className="mt-3 space-y-2 text-sm text-navy-700">
            {[
              "22+ brands already approved you",
              "Generate a tracked link in one click",
              "No following, no audience requirement",
              "One dashboard, one payout, all brands",
            ].map((l) => (
              <li key={l} className="flex gap-2"><span className="text-coral-500">✓</span><span>{l}</span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-navy-50 p-5 ring-1 ring-navy-200">
        <p className="text-sm text-navy-700">
          <span className="font-semibold text-navy-900">Why the $5?</span>{" "}
          Brand partnerships at this quality have minimums and management costs. The membership covers the gatekeeping work so
          members can walk straight in. Cancel anytime — but past earnings stay yours forever.
        </p>
      </div>

      <div className="mt-8">
        <a href="/signup?pricing_variant=C" className="btn-primary text-base">Get the keys — $5/mo</a>
        <p className="mt-3 text-xs text-navy-500 max-w-xl">
          $5/mo billed monthly. Cancel anytime via the customer portal. See full terms at{" "}
          <a href="/terms" className="underline">/terms</a>.
        </p>
      </div>
      <Anno side="right">Variant C · cookie value &quot;C&quot;</Anno>
    </div>
  );
}

function SectionPricingABTest({ t }) {
  // PARKED (2026-05-18): Variant B (credit-back) on indefinite hold pending Terms
  // #membership-credit legal review + Variant C signal. Render C ONLY in demo.
  // Cookie + Stripe metadata wiring stays in code (SectionPricingABTest.tsx,
  // lib/funnel-lab/pricing-variants.ts) — one-line flip to reactivate.
  return (
    <Section id="pricing" n="7" name="Pricing" file="sections/SectionPricingABTest.tsx" event="LP_Section_Pricing">
      <Reveal>
        <VariantC />
      </Reveal>

      <AnnoSpec rows={[
        ["Now showing",  <><span className="tok-coral tok">Variant C only</span> — Variant B parked 2026-05-18 pending Terms #membership-credit legal review</>],
        ["A/B status",   <>Code-side wiring kept intact in <code>SectionPricingABTest.tsx</code> + <code>lib/funnel-lab/pricing-variants.ts</code> · reactivate B by flipping <code>randomPricingVariant()</code> back to 50/50</>],
        ["Cookie",       <><code>PRICING_VARIANT_COOKIE</code> · sticky 90 days · set by <code>LPBaseline.tsx</code> · while parked, all new visitors land on C</>],
        ["Events",       <><code>LP_Pricing_Assigned</code> on first paint · <code>LP_Pricing_CTAClicked</code> on CTA click · keeps firing with variant=C so funnels stay consistent post-reactivation</>],
        ["Stripe",       <>Variant passes via <code>?pricing_variant=C</code> querystring to <code>/signup</code> · Stripe metadata <code>pricing_variant</code> attached on checkout session create</>],
        ["C accents",    <><span className="tok">ring-2 ring-navy-300</span> outer · inner with-vs-without uses <span className="tok">bg-navy-900 + bg-coral-50</span> two-up</>],
        ["When B unparks", <>Restore <code>TweakRadio</code> in <code>app.jsx</code> Tweaks panel · flip <code>randomPricingVariant()</code> split · re-verify <code>/terms#membership-credit</code> clause</>],
      ]} />
    </Section>
  );
}

window.SectionPricingABTest = SectionPricingABTest;
