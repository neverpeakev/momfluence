/* global React, Reveal, Section, AnnoSpec, AssetSlot, Anno */
/**
 * Hero (variant-specific, above-the-fold).
 *
 * NOT part of LPBaseline.tsx — lives in app/lp/[variant]/page.tsx.
 * Shown here only so the page reads as a complete LP. The Tweaks panel
 * cycles five hero compositions / two voice tones to demo the variant
 * surface space.
 */
function SectionHero({ t }) {
  const compositions = ["split", "stack", "centered", "phone-left", "dense"];
  const composition = compositions.includes(t.heroComp) ? t.heroComp : "split";
  const voice = t.heroVoice || "warm";

  const headlines = {
    warm:     "Get paid for the stuff you’re already telling your friends about.",
    direct:   "Real brands. Tracked links. Big bucks — without an audience.",
    testimony:"“I send the link instead of just the name. Nothing about how I share has changed.”",
  };
  const subs = {
    warm:     "Pick a brand, share your link, get your cut. Regular moms — no followers, no camera, no experience. $5/month, cancel anytime.",
    direct:   "MomFluence is a $5/mo membership that turns your group-chat recommendations into recurring commission. Find out more below.",
    testimony:"Kelly’s our first paying member. She’s the founder’s wife — and a regular mom with three kids. The math works the same for everyone.",
  };

  const ctaPrimary = (
    <a href="#pricing" className="btn-primary text-sm sm:text-base">Get yours — $5/mo →</a>
  );
  const ctaGhost = (
    <a href="#how-it-works" className="inline-flex items-center justify-center rounded-xl border border-navy-200 bg-white px-5 py-3 text-sm font-medium text-navy-700 hover:bg-navy-50 transition no-underline">
      How it works
    </a>
  );

  const eyebrow = (
    <span className="hero-eyebrow">
      <span className="h-1.5 w-1.5 rounded-full bg-coral-500" />
      The simplest side income on the internet
    </span>
  );

  const visual = (
    <div className="relative">
      <AssetSlot
        label="Hero visual · variant slot"
        name="Phone mock or lifestyle photo"
        dims="≈ 480 × 560 desktop · ≈ 320 × 380 mobile"
        height={420}
        className="w-full"
      >
        <p className="mt-3 max-w-[18rem] text-[10.5px] text-navy-500 font-sans normal-case tracking-normal font-normal">
          Per /lp/&lt;variant&gt; — different hero per ad hook. Lives in <code className="font-mono text-[10px] text-navy-700">app/lp/[variant]/page.tsx</code>, not <code className="font-mono text-[10px] text-navy-700">LPBaseline</code>.
        </p>
      </AssetSlot>
      <Anno side="right">variant: %slug% · hero only</Anno>
    </div>
  );

  if (composition === "centered") {
    return (
      <Section id="hero" n="0" name="Hero (variant-specific)" file="app/lp/[variant]/page.tsx" event="LP_Visit">
        <div className="text-center">
          <Reveal>{eyebrow}</Reveal>
          <Reveal delay={60} as="h1" className="mt-5 text-4xl sm:text-5xl md:text-6xl text-navy-900 h-display max-w-3xl mx-auto text-balance">
            {headlines[voice]}
          </Reveal>
          <Reveal delay={120} as="p" className="mt-5 text-base sm:text-lg text-navy-600 max-w-2xl mx-auto">
            {subs[voice]}
          </Reveal>
          <Reveal delay={180} className="mt-7 flex flex-wrap justify-center gap-3">
            {ctaPrimary}{ctaGhost}
          </Reveal>
          <Reveal delay={240} className="mt-12 mx-auto max-w-md">{visual}</Reveal>
        </div>
        <HeroSpec composition={composition} voice={voice} />
      </Section>
    );
  }
  if (composition === "stack") {
    return (
      <Section id="hero" n="0" name="Hero (variant-specific)" file="app/lp/[variant]/page.tsx" event="LP_Visit">
        <Reveal>{eyebrow}</Reveal>
        <Reveal delay={60} as="h1" className="mt-4 text-4xl sm:text-5xl md:text-6xl text-navy-900 h-display text-balance">
          {headlines[voice]}
        </Reveal>
        <Reveal delay={120} as="p" className="mt-4 text-base sm:text-lg text-navy-600 max-w-2xl">
          {subs[voice]}
        </Reveal>
        <Reveal delay={180} className="mt-6 flex flex-wrap gap-3">{ctaPrimary}{ctaGhost}</Reveal>
        <Reveal delay={240} scale className="mt-10">{visual}</Reveal>
        <HeroSpec composition={composition} voice={voice} />
      </Section>
    );
  }
  if (composition === "phone-left") {
    return (
      <Section id="hero" n="0" name="Hero (variant-specific)" file="app/lp/[variant]/page.tsx" event="LP_Visit">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
          <Reveal scale className="order-2 lg:order-1 lg:max-w-sm">{visual}</Reveal>
          <div className="order-1 lg:order-2">
            <Reveal>{eyebrow}</Reveal>
            <Reveal delay={60} as="h1" className="mt-4 text-4xl sm:text-5xl md:text-6xl text-navy-900 h-display text-balance">
              {headlines[voice]}
            </Reveal>
            <Reveal delay={120} as="p" className="mt-4 text-base sm:text-lg text-navy-600">
              {subs[voice]}
            </Reveal>
            <Reveal delay={180} className="mt-6 flex flex-wrap gap-3">{ctaPrimary}{ctaGhost}</Reveal>
          </div>
        </div>
        <HeroSpec composition={composition} voice={voice} />
      </Section>
    );
  }
  if (composition === "dense") {
    return (
      <Section id="hero" n="0" name="Hero (variant-specific)" file="app/lp/[variant]/page.tsx" event="LP_Visit">
        <div className="rounded-3xl bg-navy-900 p-7 sm:p-10 text-white">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_auto] lg:items-center">
            <div>
              <Reveal>
                <span className="hero-eyebrow" style={{ background: "rgba(255,255,255,0.08)", color: "#ffbaa6", borderColor: "rgba(255,186,166,0.3)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-coral-400" />
                  The simplest side income on the internet
                </span>
              </Reveal>
              <Reveal delay={60} as="h1" className="mt-4 text-4xl sm:text-5xl md:text-6xl text-white h-display text-balance">
                {headlines[voice]}
              </Reveal>
              <Reveal delay={120} as="p" className="mt-4 text-base sm:text-lg text-navy-200">
                {subs[voice]}
              </Reveal>
              <Reveal delay={180} className="mt-6 flex flex-wrap gap-3">
                <a href="#pricing" className="btn-primary">Get yours — $5/mo →</a>
                <a href="#how-it-works" className="btn-ghost-dark">How it works</a>
              </Reveal>
            </div>
            <Reveal scale className="max-w-xs justify-self-center lg:justify-self-end">
              <AssetSlot label="Hero visual · variant slot" name="Phone mock" dims="≈ 320 × 380" height={360} />
            </Reveal>
          </div>
        </div>
        <HeroSpec composition={composition} voice={voice} />
      </Section>
    );
  }
  // default split
  return (
    <Section id="hero" n="0" name="Hero (variant-specific)" file="app/lp/[variant]/page.tsx" event="LP_Visit">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_auto] lg:items-center">
        <div>
          <Reveal>{eyebrow}</Reveal>
          <Reveal delay={60} as="h1" className="mt-4 text-4xl sm:text-5xl md:text-6xl text-navy-900 h-display text-balance">
            {headlines[voice]}
          </Reveal>
          <Reveal delay={120} as="p" className="mt-4 text-base sm:text-lg text-navy-600">
            {subs[voice]}
          </Reveal>
          <Reveal delay={180} className="mt-6 flex flex-wrap gap-3">{ctaPrimary}{ctaGhost}</Reveal>
          <Reveal delay={220} className="mt-5 flex items-center gap-3 text-xs text-navy-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Cancel anytime
            </span>
            <span>·</span>
            <span>No following required</span>
            <span>·</span>
            <span>Fast-track first $25</span>
          </Reveal>
        </div>
        <Reveal scale className="max-w-sm justify-self-center lg:justify-self-end">{visual}</Reveal>
      </div>
      <HeroSpec composition={composition} voice={voice} />
    </Section>
  );
}

function HeroSpec({ composition, voice }) {
  return (
    <AnnoSpec rows={[
      ["Source",      <><code>app/lp/[variant]/page.tsx</code> — <span className="tok">NOT</span> in <code>LPBaseline.tsx</code>. 10 variants in <code>lib/funnel-lab/variants.ts</code>.</>],
      ["Composition", <>Current: <span className="tok-coral tok">{composition}</span> · Tweak: <code>heroComp</code> · Variants share copy slots, swap layout.</>],
      ["Voice tone",  <>Current: <span className="tok-coral tok">{voice}</span> · Tweak: <code>heroVoice</code> · Each /lp/&lt;variant&gt; locks one tone; previews all three.</>],
      ["Event",       <><code>LP_Visit</code> fires once on first paint (page-level, not section).</>],
      ["Asset",       <>Variant-specific phone mock or lifestyle photo · <code>/public/lp-baseline/heroes/&lt;variant&gt;.{`{png,svg}`}</code></>],
      ["Tokens",      <><code>h-display</code> = Playfair 700, –0.01em · CTA <span className="tok-coral tok">btn-primary</span> (<code>bg-coral-500</code>) · Eyebrow <span className="tok-coral tok">coral-700 on coral-50</span></>],
    ]} />
  );
}

window.SectionHero = SectionHero;
