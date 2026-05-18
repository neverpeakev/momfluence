/* global React, Reveal, Section, AnnoSpec, Eyebrow, EarningsDisclaimer, Anno */
/**
 * §5 — Brand wall
 * Source: components/landing/sections/SectionBrandWall.tsx
 * Event:  LP_Section_BrandWall
 *
 * Pulls from lib/landing/brand-wall-data.ts (mirrored in lib/data.js).
 *   • 6 highlight cards with payout + payout-type explainer
 *   • Full grid of 22 brands as letter-mark fallbacks (real SVG logos
 *     drop into /public/lp-baseline/logos/<slug>.svg progressively)
 */
function BrandLogo({ b }) {
  const m = window.LP_DATA.BRAND_MARKS[b.slug] || { bg: "#141a30", fg: "#fff", mark: b.brand[0] };
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 ring-1 ring-navy-100 hover:ring-coral-200 transition-shadow aspect-[3/2]">
      <span
        className="flex items-center justify-center rounded-full mb-2"
        style={{ background: m.bg, color: m.fg, width: 32, height: 32, fontSize: 11, fontWeight: 800, fontFamily: '"DM Sans", system-ui' }}
      >{m.mark}</span>
      <p className="text-center text-[11px] font-semibold text-navy-800 leading-tight">{b.brand}</p>
    </div>
  );
}

function HighlightCard({ b }) {
  const { VERTICALS, payoutLabel } = window.LP_DATA;
  const verticalLabel = VERTICALS.find((v) => v.slug === b.vertical)?.label || b.vertical;
  const m = window.LP_DATA.BRAND_MARKS[b.slug] || { bg: "#141a30", fg: "#fff", mark: b.brand[0] };
  const explainer =
    b.payoutType === "rev_share"
      ? "Recurring monthly commission for as long as the customer stays subscribed."
      : b.payoutType === "cpl"
      ? "Paid out per qualified lead (signup with valid info)."
      : "Paid out per confirmed purchase or signup.";
  return (
    <div className="rounded-2xl bg-coral-50 p-5 ring-2 ring-coral-200">
      <div className="flex items-start justify-between">
        <Eyebrow>{verticalLabel}</Eyebrow>
        <span
          className="flex items-center justify-center rounded-full"
          style={{ background: m.bg, color: m.fg, width: 36, height: 36, fontSize: 13, fontWeight: 800 }}
        >{m.mark}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-navy-900">{b.brand}</p>
      <p className="mt-2 text-base text-coral-700 font-semibold">{payoutLabel(b)}</p>
      <p className="mt-2 text-xs text-navy-600">{explainer}</p>
    </div>
  );
}

function SectionBrandWall() {
  const { BRANDS, VERTICALS } = window.LP_DATA;
  const highlighted = BRANDS.filter((b) => b.highlight);
  return (
    <Section id="brands" n="5" name="Brand wall" file="sections/SectionBrandWall.tsx" event="LP_Section_BrandWall">
      <Reveal>
        <Eyebrow>{BRANDS.length}+ brands across {VERTICALS.length} categories</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
          Real brands. Real payouts. No applications.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          Every brand below has already approved MomFluence as a partner. You don’t apply, you don’t wait,
          you don’t need a following. Pick the brand, generate your link, share.
        </p>
      </Reveal>

      <div className="mt-10 relative">
        <Eyebrow tone="navy">Top-paying programs right now</Eyebrow>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlighted.map((b, i) => (
            <Reveal key={b.slug} delay={i * 50}><HighlightCard b={b} /></Reveal>
          ))}
        </div>
        <EarningsDisclaimer density="compact" className="mt-3" />
        <Anno side="right">6 highlight cards · per <code>highlight: true</code> in brand-wall-data.ts</Anno>
      </div>

      <div className="mt-12">
        <Eyebrow tone="navy">Full active partner list</Eyebrow>
        <Reveal className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {BRANDS.map((b) => (
            <BrandLogo key={b.slug} b={b} />
          ))}
        </Reveal>
      </div>

      <Reveal className="mt-8">
        <p className="text-sm text-navy-600">
          <span className="font-semibold text-navy-900">New brands added every week.</span>{" "}
          Members get first access to new programs before they’re announced publicly.
        </p>
      </Reveal>

      <AnnoSpec rows={[
        ["Data source", <><code>/lib/landing/brand-wall-data.ts</code> · refresh from <code>offers</code> table SQL in file header comment</>],
        ["Highlights",  <>6 brands with <code>highlight: true</code> · auto-rendered into the top grid · Top of file currently: Paramount+ $7.20 · Klarna $35 · Open Farm $60 · Shopify $50 · Base44 $50 · Sesame $80</>],
        ["Logo strategy", <>Letter-mark fallback today · ship <code>/public/lp-baseline/logos/&lt;slug&gt;.svg</code> per brand · component auto-detects file presence</>],
        ["Aspect",      <>Brand cells <span className="tok">aspect-[3/2]</span> · letter-mark <span className="tok">32×32 rounded-full</span> with brand-specific bg/fg from <code>BRAND_MARKS</code></>],
        ["Grid",        <><span className="tok">grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6</span> · 22 brands wrap into 4 rows at lg</>],
        ["FTC",         <>Disclaimer under highlight grid · payout numbers attributed to current offer table state (snapshot in file header)</>],
      ]} />
    </Section>
  );
}

window.SectionBrandWall = SectionBrandWall;
