/* global React, Reveal, Section, AnnoSpec, Eyebrow, Anno */
/**
 * §3 — Myriad ways to share (8-channel grid)
 * Source: components/landing/sections/SectionMyriadWaysToShare.tsx
 * Event:  LP_Section_ShareChannels
 *
 * 8 channels, none requiring followers. Emoji icons are intentional in v2;
 * channel illustrations ship in /public/lp-baseline/channels/ as
 * progressive enhancement (component fallback: emoji as today).
 */
function SectionMyriadWaysToShare() {
  const CHANNELS = window.LP_DATA.CHANNELS;
  return (
    <Section id="ways-to-share" n="3" name="Myriad ways to share" file="sections/SectionMyriadWaysToShare.tsx" event="LP_Section_ShareChannels">
      <Reveal>
        <Eyebrow>You don’t need a following</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
          Eight ways to share that don’t require an audience.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          You don’t need to make videos. You don’t need a TikTok. You don’t even have to tell your friends what you’re doing.
          These are the places real moms drop links every day.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((c, i) => (
          <Reveal as="article" key={c.slug} delay={i * 40}
            className="rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-coral-200 transition-shadow relative">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-2xl">{c.icon}</div>
              <div className="min-w-0">
                <h3 className="text-base text-navy-900 font-semibold">{c.name}</h3>
                <p className="mt-2 text-sm leading-6 text-navy-700">{c.pitch}</p>
                <p className="mt-3 text-xs italic text-navy-500">Example: {c.example}</p>
              </div>
            </div>
            {i === 0 ? (
              <Anno side="bottom-right">
                channels[{c.slug}] · illustration slot <code>/lp-baseline/channels/{c.slug}.svg</code>
              </Anno>
            ) : null}
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-8">
        <p className="text-sm text-navy-600 max-w-3xl">
          <span className="font-semibold text-navy-900">Important:</span> when you share an affiliate link, FTC rules require
          you to disclose that it’s a paid recommendation. We give you copy-paste disclosures that satisfy the FTC’s rules —
          they take 4 words to add and you only have to do it once per post.
        </p>
      </Reveal>

      <AnnoSpec rows={[
        ["Grid",        <><span className="tok">grid-cols-1 sm:grid-cols-2</span> · gap-4 · 8 cards in 2 cols above sm:, 1 col mobile</>],
        ["Card",        <><span className="tok">rounded-2xl bg-white p-5 ring-1 ring-navy-100</span> · hover <span className="tok-coral tok">ring-coral-200</span></>],
        ["Icon",        <>Emoji (v6-locked) in <span className="tok">h-11 w-11 rounded-xl bg-navy-50</span> · upgrade path: 64×64 SVG illustration with matching emoji visual DNA</>],
        ["Asset slot",  <>8× channel illustrations · <code>/public/lp-baseline/channels/&lt;slug&gt;.svg</code> · slugs: groupchats, fbgroups, reddit, pinterest, tiktok, nextdoor, email-sig, youtube</>],
        ["Animation",   <>Stagger <span className="tok">delay: 0.04 * i</span> · <span className="tok">duration: 0.35</span> · fade-up</>],
        ["FTC",         <>Footer paragraph references <code>/disclosures/affiliate-marketing</code></>],
      ]} />
    </Section>
  );
}

window.SectionMyriadWaysToShare = SectionMyriadWaysToShare;
