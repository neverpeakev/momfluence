/* global React, Reveal, Section, AnnoSpec, Anno */
/**
 * §9 — Closing CTA (variant-specific voice)
 * Source: components/landing/sections/SectionClosingCTA.tsx
 * Event:  LP_Section_ClosingCTA · LP_ClosingCTA_Clicked
 *
 * Props come from variants.ts per /lp/<variant>. Shown here with the
 * default warm-tone closer; Tweaks panel cycles three sample variants.
 */
const CLOSERS = {
  warm: {
    headline: "Your group chat just became a paycheck.",
    subhead: "Pick a brand, share your link, get your cut. $5/mo membership. Cancel anytime.",
    ctaPrimary: "Get yours — $5/mo",
  },
  direct: {
    headline: "$5 in. Your first $25 out.",
    subhead: "We fast-track your first cashout so you can verify the platform works before earning bigger numbers.",
    ctaPrimary: "Find out more — $5/mo",
  },
  testimony: {
    headline: "Kelly went first. You can be the second.",
    subhead: "Founding member treatment for the first 100 signups. Direct line to the founder, priority on new brands.",
    ctaPrimary: "Become a founding member",
  },
};

function SectionClosingCTA({ t }) {
  const c = CLOSERS[t.heroVoice] || CLOSERS.warm;
  return (
    <Section id="closing-cta" n="9" name="Closing CTA" file="sections/SectionClosingCTA.tsx" event="LP_Section_ClosingCTA">
      <div className="rounded-3xl bg-navy-900 p-10 sm:p-14 text-center relative overflow-hidden">
        {/* soft coral atmosphere — single radial, no gradient slop */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(240,74,37,0.18), transparent)" }} />

        <h2 className="text-4xl sm:text-5xl text-white h-display text-balance relative">{c.headline}</h2>
        <p className="mt-4 text-base sm:text-lg text-navy-200 max-w-2xl mx-auto relative">{c.subhead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 relative">
          <a href="/signup" className="btn-primary text-base">{c.ctaPrimary}</a>
          <a href="/how-it-works" className="btn-ghost-dark">Read the full breakdown →</a>
        </div>
        <p className="mt-6 text-xs text-navy-400 relative">
          $5/mo membership. Cancel anytime. Example earnings shown elsewhere on this page are illustrative — individual results vary.
        </p>
        <Anno side="right">props from variants.ts · cycled via Tweaks → Voice</Anno>
      </div>

      <AnnoSpec rows={[
        ["Surface",     <><span className="tok">rounded-3xl bg-navy-900 p-10 sm:p-14</span> · single coral radial accent · brand signature: every long page ends in this dark zone</>],
        ["Headline",    <><span className="tok">text-4xl sm:text-5xl text-white</span> · Playfair 700 · variant-specific copy from <code>variants.ts</code></>],
        ["CTA primary", <><code>btn-primary</code> (<span className="tok-coral tok">bg-coral-500</span>) · same component as hero CTA · fires <code>LP_ClosingCTA_Clicked</code> · href appends pricing_variant querystring</>],
        ["CTA ghost",   <>Custom <code>btn-ghost-dark</code> for dark background · <span className="tok">border-navy-700 · text-navy-100</span> · hover <span className="tok">bg-navy-800</span></>],
        ["Voice lock",  <>Currently rendering tone <span className="tok-coral tok">{t.heroVoice || "warm"}</span> · v6 closer phrasings vetted: “get yours”, “find out more”, “Become a founding member”</>],
        ["FTC footer",  <>Single-line disclaimer mandatory at bottom of dark CTA · cancellation language required by Stripe customer-portal policy</>],
      ]} />
    </Section>
  );
}

window.SectionClosingCTA = SectionClosingCTA;
