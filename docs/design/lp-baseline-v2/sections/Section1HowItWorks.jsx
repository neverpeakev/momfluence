/* global React, Reveal, Section, AnnoSpec, Eyebrow, EarningsDisclaimer, Anno */
/**
 * §1 — How it works  (Pick / Share / Get paid)
 * Source: components/landing/sections/SectionHowItWorks.tsx
 * Event:  LP_Section_HowItWorks
 *
 * Mirrors PR #41 verbatim (copy locked). The animated phone is rendered
 * inline via the same TextDemo markup the production component uses.
 */
const HIW_STEPS = [
  { n: 1, icon: "🛒", title: "Pick a brand from your dashboard",
    body: "Browse a curated wall of vetted brands — streaming, beauty, savings apps, pet food, family safety. You don’t apply, you don’t wait. The brands already said yes." },
  { n: 2, icon: "🔗", title: "Share your tracked link",
    body: "Drop it in a group text, a Reddit comment, a Pinterest pin, a Facebook mom group, your email signature. Anywhere people might want to know. You don’t need a following." },
  { n: 3, icon: "💸", title: "Get paid when someone clicks and buys",
    body: "Commissions land in your dashboard as soon as the brand confirms the conversion — usually within 24-72 hours. Cash out to PayPal, Venmo, or bank when you’ve earned $25 or more." },
];

function TextDemo() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.75rem] bg-navy-900 p-2 shadow-xl ring-1 ring-black/10">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-white">
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-navy-900" aria-hidden="true" />
          <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[10px] font-semibold text-navy-700">
            <span>9:41</span><span className="opacity-60">●●●●● 5G</span>
          </div>
          <div className="flex items-center gap-2 border-b border-navy-100 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">J</div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-navy-900">Jess</p>
              <p className="text-[10px] text-navy-500">iMessage</p>
            </div>
          </div>
          <div className="flex h-[260px] flex-col gap-2 overflow-hidden bg-[#fafbfc] px-3 py-3">
            <p className="self-center text-[10px] uppercase tracking-wider text-navy-400">Today 7:42 PM</p>
            <div className="demo-bubble-1 max-w-[78%] self-start rounded-2xl rounded-bl-md bg-navy-100 px-3.5 py-2 text-[13px] leading-snug text-navy-900">
              ok i’m so bored tonight 😩 anything good to watch??
            </div>
            <div className="demo-bubble-2 max-w-[78%] self-end rounded-2xl rounded-br-md bg-[#34b7f1] px-3.5 py-2 text-[13px] leading-snug text-white shadow-sm">
              omg YES — start <em>The Pitt</em> on Max. just finished s1, we couldn’t stop 🙌
            </div>
            <div className="demo-typing self-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-navy-100 px-3.5 py-2.5">
                <span className="demo-dot h-1.5 w-1.5 rounded-full bg-navy-500" />
                <span className="demo-dot demo-dot-2 h-1.5 w-1.5 rounded-full bg-navy-500" />
                <span className="demo-dot demo-dot-3 h-1.5 w-1.5 rounded-full bg-navy-500" />
              </div>
            </div>
            <div className="demo-bubble-3 max-w-[78%] self-end rounded-2xl rounded-br-md bg-[#34b7f1] px-3.5 py-2 text-[13px] leading-snug text-white shadow-sm">
              here’s my link if you sign up — momflu.cc/jess 💖
            </div>
          </div>
          <div className="border-t border-navy-100 bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-full border border-navy-200 px-3 py-1.5 text-[11px] text-navy-400">iMessage</div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-100 text-[10px] text-navy-500">↑</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-2 -top-2 rotate-6 rounded-full bg-coral-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">$ tracked</div>
    </div>
  );
}

function SectionHowItWorks() {
  return (
    <Section id="how-it-works" n="1" name="How it works" file="sections/SectionHowItWorks.tsx" event="LP_Section_HowItWorks">
      <Reveal>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900">Pick. Share. Get paid.</h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          The same way bloggers and podcasters have made money for 20 years — built for moms with phones and group chats.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <ol className="space-y-8">
          {HIW_STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 100} className="flex items-start gap-4 relative">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-2xl">{s.icon}</div>
              <div className="min-w-0">
                <Eyebrow>Step {s.n}</Eyebrow>
                <h3 className="mt-1 text-xl text-navy-900 font-display font-bold">{s.title}</h3>
                <p className="mt-2 text-base text-navy-700">{s.body}</p>
              </div>
              {i === 0 ? <Anno side="right">emoji = locked v2 · 64×64 illustration TODO</Anno> : null}
            </Reveal>
          ))}
        </ol>
        <Reveal scale className="flex justify-center lg:justify-end relative">
          <div className="relative">
            <TextDemo />
            <p className="mt-3 text-center text-xs text-navy-500">Animated example. Not a real customer.</p>
            <Anno side="bottom-right">14s loop · CSS keyframes · reduced-motion: freezes</Anno>
          </div>
        </Reveal>
      </div>

      <EarningsDisclaimer density="compact" className="mt-8" />

      <AnnoSpec rows={[
        ["Heading",     <><span className="tok">text-3xl sm:text-4xl</span> · <span className="tok">text-navy-900</span> · <code>h-display</code> (Playfair 700)</>],
        ["Eyebrow",     <><span className="tok-coral tok">text-coral-600</span> · <span className="tok">text-xs uppercase tracking-widest font-semibold</span></>],
        ["Step icon",   <><span className="tok-coral tok">bg-coral-100</span> · <span className="tok">h-12 w-12 rounded-2xl</span> · emoji set v6-locked — illustration replacement <code>NOT</code> approved yet</>],
        ["Layout",      <><span className="tok">grid-cols-1</span> below <code>lg</code>; phone moves below at <code>&lt; 1024px</code></>],
        ["Animation",   <>FM <code>fade-up</code> · <span className="tok">duration: 0.5</span> · <span className="tok">ease: easeOut</span> · viewport <span className="tok">amount: 0.3, once</span> · steps stagger by <span className="tok-coral tok">delay: 0.1 * i</span></>],
        ["Asset slot",  <>TextDemo phone (CSS-animated, no asset) · FTC: “Animated example. Not a real customer.”</>],
      ]} />
    </Section>
  );
}

window.SectionHowItWorks = SectionHowItWorks;
