/* global React, ReactDOM */
/* global SectionHero, SectionHowItWorks, SectionAffiliateMarketing101, SectionMyriadWaysToShare,
          SectionEarningsCalculator, SectionDashboardTour, SectionBrandWall, SectionComparison,
          SectionSocialProof, SectionPricingABTest, SectionFAQ, SectionClosingCTA */
/* global useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect */

/**
 * LP Baseline v2 — orchestrator
 * Mirrors components/landing/LPBaseline.tsx section order.
 *
 * Top-of-page chrome:
 *   • Sticky annotation pill (always visible) — section depth · current Tweaks
 *   • Site header (lifts from v1 marketing site)
 *
 * Tweaks (one place, one source of truth):
 *   • heroComp  — split | stack | centered | phone-left | dense
 *   • heroVoice — warm | direct | testimony
 *   • typeMode  — display | sans | oversize
 *   • density   — breathy | default | dense
 *   • pricingVariant — B | C  (overrides cookie for preview)
 *   • annotate  — on | off
 */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroComp": "split",
  "heroVoice": "warm",
  "typeMode": "display",
  "density": "default",
  "pricingVariant": "C",
  "annotate": "on"
}/*EDITMODE-END*/;

function StickyDepthPill({ t }) {
  return (
    <div
      className="anno"
      style={{
        position: "fixed",
        bottom: 18, left: 18,
        zIndex: 40,
        padding: "6px 10px 6px 8px",
        borderRadius: 999,
        background: "rgba(20,26,48,0.92)",
        color: "#fff",
        fontSize: 11,
        lineHeight: 1,
        fontWeight: 600,
        display: "inline-flex", alignItems: "center", gap: 8,
        boxShadow: "0 6px 18px -8px rgba(20,26,48,.4)",
        backdropFilter: "blur(8px)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        letterSpacing: 0.02,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: 999, background: "#f04a25", color: "#fff", fontSize: 10 }}>v2</span>
      <span>LPBaseline · {t.heroComp}/{t.heroVoice} · {t.typeMode} · {t.density} · pricing={t.pricingVariant}</span>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 no-underline">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-coral-500 font-display font-bold text-lg">M</span>
          <span className="text-base font-display font-bold text-navy-900">MomFluence</span>
        </a>
        <nav className="hidden sm:flex items-center gap-1 text-sm text-navy-700">
          <a className="px-3 py-1.5 rounded-md hover:bg-navy-50 no-underline" style={{ color: "#243155" }} href="#how-it-works">How it works</a>
          <a className="px-3 py-1.5 rounded-md hover:bg-navy-50 no-underline" style={{ color: "#243155" }} href="#brands">Brands</a>
          <a className="px-3 py-1.5 rounded-md hover:bg-navy-50 no-underline" style={{ color: "#243155" }} href="#pricing">Pricing</a>
          <a className="px-3 py-1.5 rounded-md hover:bg-navy-50 no-underline" style={{ color: "#243155" }} href="#faq">FAQ</a>
        </nav>
        <a href="#pricing" className="btn-primary text-sm py-2 px-3.5">Get yours →</a>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-navy-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 text-sm text-navy-600">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-coral-500 font-display font-bold text-lg">M</span>
              <span className="text-base font-display font-bold text-navy-900">MomFluence</span>
            </div>
            <p className="mt-3 max-w-sm">Get paid for the stuff you’re already sharing. $5/mo · cancel anytime.</p>
          </div>
          <FooterCol title="Product" links={[["How it works", "#how-it-works"], ["Brands", "#brands"], ["Pricing", "#pricing"], ["FAQ", "#faq"]]} />
          <FooterCol title="Disclosures" links={[["Affiliate marketing", "/disclosures/affiliate-marketing"], ["Earnings", "/disclosures/earnings"], ["Terms", "/terms"], ["Privacy", "/privacy"]]} />
          <FooterCol title="Reach us" links={[["hello@momfluence.app", "mailto:hello@momfluence.app"], ["Founding member?", "#social-proof"]]} />
        </div>
        <p className="mt-10 text-xs text-navy-500">
          © {new Date().getFullYear()} Never Peak Inc. · Numbers shown anywhere on this page are illustrative examples, not guarantees. Individual results vary.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-navy-500 font-semibold">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map(([l, h]) => (
          <li key={l}><a href={h} className="hover:text-coral-700 no-underline" style={{ color: "#2c3d6c" }}>{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

function TweaksPanelLP({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection title="Hero (above-the-fold · variant slot)">
        <TweakSelect label="Composition" value={t.heroComp} onChange={(v) => setTweak("heroComp", v)}
          options={[
            { value: "split",       label: "Split (text · phone)" },
            { value: "stack",       label: "Stack (text, then phone)" },
            { value: "centered",    label: "Centered (one-column)" },
            { value: "phone-left",  label: "Phone-left, text-right" },
            { value: "dense",       label: "Dense (dark hero panel)" },
          ]} />
        <TweakRadio label="Voice tone" value={t.heroVoice} onChange={(v) => setTweak("heroVoice", v)}
          options={[
            { value: "warm",     label: "Warm" },
            { value: "direct",   label: "Direct" },
            { value: "testimony",label: "Testimony" },
          ]} />
      </TweakSection>

      <TweakSection title="Type & Density (system-wide)">
        <TweakRadio label="Display headings" value={t.typeMode} onChange={(v) => setTweak("typeMode", v)}
          options={[
            { value: "display",  label: "Playfair" },
            { value: "sans",     label: "DM Sans" },
            { value: "oversize", label: "Oversize" },
          ]} />
        <TweakRadio label="Section density" value={t.density} onChange={(v) => setTweak("density", v)}
          options={[
            { value: "breathy", label: "Breathy" },
            { value: "default", label: "Default" },
            { value: "dense",   label: "Dense" },
          ]} />
      </TweakSection>

      <TweakSection title="Handoff chrome">
        <TweakToggle label="Show annotation overlay" value={t.annotate === "on"}
          onChange={(v) => setTweak("annotate", v ? "on" : "off")} />
      </TweakSection>
    </TweaksPanel>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply globals on root document element
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-density", t.density);
    root.setAttribute("data-type-mode", t.typeMode);
    root.setAttribute("data-annotate", t.annotate);
  }, [t.density, t.typeMode, t.annotate]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pb-8 flex-1">
        <SectionHero t={t} />
        <SectionHowItWorks />
        <SectionAffiliateMarketing101 />
        <SectionMyriadWaysToShare />
        <SectionEarningsCalculator />
        <SectionDashboardTour />
        <SectionBrandWall />
        <SectionComparison />
        <SectionSocialProof />
        <SectionPricingABTest t={t} />
        <SectionFAQ />
        <SectionClosingCTA t={t} />
      </main>
      <SiteFooter />
      <StickyDepthPill t={t} />
      <TweaksPanelLP t={t} setTweak={setTweak} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
