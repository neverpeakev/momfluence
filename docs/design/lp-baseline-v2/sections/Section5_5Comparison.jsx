/* global React, Reveal, Section, AnnoSpec, Eyebrow, EarningsDisclaimer, Anno */
/**
 * §5.5 — Comparison vs other side hustles (NEW · approved in scoping)
 *
 * Trust builder. Honest table — we don't claim MomFluence wins every row.
 * Categories chosen to fit the mom audience: time-to-first-dollar, setup
 * cost, audience required, recurring revenue, ceiling. Cite competitors
 * fairly.
 *
 * Engineering: ship as <SectionComparison /> with <LPSectionTracker
 * event={LP_SECTION_EVENTS.Comparison} />. Add LP_SECTION_EVENTS.Comparison
 * to lib/funnel-lab/lp-events.ts before merging.
 */
const ROWS = [
  { dim: "Time to first dollar",      mom: "Same day ($25 fast-track)", others: ["Instacart","Surveys","Reselling","MLM"], vals: ["1–7 days","Hours","2–4 weeks","Weeks–months"] },
  { dim: "Up-front cost",              mom: "$5/mo (refundable if you don't earn it back)", others: ["Instacart","Surveys","Reselling","MLM"], vals: ["$0","$0","Inventory","$100–$500 starter kit"] },
  { dim: "Audience / following needed", mom: "None",                       others: ["Instacart","Surveys","Reselling","MLM"], vals: ["None","None","Buyers","Yes, a downline"] },
  { dim: "Recurring revenue?",          mom: "Yes — pays monthly",         others: ["Instacart","Surveys","Reselling","MLM"], vals: ["One-time","One-time","One-time","Tied to recruiting"] },
  { dim: "Ceiling",                     mom: "Scales with sharing",        others: ["Instacart","Surveys","Reselling","MLM"], vals: ["Capped by hours","~$200/mo","Capped by inventory","Bigger but recruiting-dependent"] },
  { dim: "Time per day",                mom: "5–10 min",                    others: ["Instacart","Surveys","Reselling","MLM"], vals: ["3–6 hrs","30–60 min","2–4 hrs","Variable"] },
];

function SectionComparison() {
  return (
    <Section id="vs-other-hustles" n="5.5" name="Comparison vs other side hustles" file="sections/SectionComparison.tsx [NEW]" event="LP_Section_Comparison">
      <Reveal>
        <Eyebrow>Honest comparison</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">
          MomFluence vs. every other mom side hustle.
        </h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          We’re not saying MomFluence is the best for everyone — driving Instacart pays cash today and that matters when rent
          is due Friday. But for a lot of moms, the math below is why we built this.
        </p>
      </Reveal>

      {/* Desktop table */}
      <Reveal className="mt-10 hidden md:block">
        <div className="overflow-hidden rounded-2xl ring-1 ring-navy-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50">
                <th className="text-left text-xs uppercase tracking-widest text-navy-500 font-semibold px-4 py-3 w-1/4">What you compare</th>
                <th className="text-left text-xs uppercase tracking-widest text-coral-700 font-semibold px-4 py-3 bg-coral-50 ring-1 ring-coral-200">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-coral-500" />
                    MomFluence
                  </div>
                </th>
                <th className="text-left text-xs uppercase tracking-widest text-navy-500 font-semibold px-4 py-3">Instacart / DoorDash</th>
                <th className="text-left text-xs uppercase tracking-widest text-navy-500 font-semibold px-4 py-3">Survey apps</th>
                <th className="text-left text-xs uppercase tracking-widest text-navy-500 font-semibold px-4 py-3">Reselling / Poshmark</th>
                <th className="text-left text-xs uppercase tracking-widest text-navy-500 font-semibold px-4 py-3">MLM / Direct sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {ROWS.map((r) => (
                <tr key={r.dim} className="align-top">
                  <td className="px-4 py-4 font-semibold text-navy-900">{r.dim}</td>
                  <td className="px-4 py-4 bg-coral-50/60 text-navy-900 font-medium">{r.mom}</td>
                  {r.vals.map((v, i) => <td key={i} className="px-4 py-4 text-navy-600">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Anno side="right">column 2 bg-coral-50 + ring-1 coral-200 (our column)</Anno>
      </Reveal>

      {/* Mobile cards */}
      <Reveal className="mt-10 grid gap-4 md:hidden">
        {ROWS.map((r) => (
          <div key={r.dim} className="rounded-2xl bg-white p-5 ring-1 ring-navy-100">
            <p className="text-xs uppercase tracking-widest text-navy-500 font-semibold">{r.dim}</p>
            <div className="mt-3 rounded-xl bg-coral-50 p-3 ring-1 ring-coral-200">
              <p className="text-[10px] uppercase tracking-widest text-coral-700 font-semibold">MomFluence</p>
              <p className="mt-1 text-sm text-navy-900 font-medium">{r.mom}</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-navy-600">
              {r.others.map((o, i) => (
                <li key={o} className="flex justify-between gap-3 border-b border-navy-100 pb-1.5 last:border-0">
                  <span className="text-navy-500 font-medium">{o}</span>
                  <span className="text-navy-700">{r.vals[i]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Reveal>

      <Reveal className="mt-6">
        <p className="text-sm text-navy-600 max-w-3xl">
          Numbers reflect typical reported earnings, not guarantees, and are sourced from public reporting on each platform.
          MomFluence isn’t a fit for every mom — but if you’re already recommending things in your group chat, it’s the
          path with the least new work.
        </p>
      </Reveal>

      <EarningsDisclaimer density="compact" className="mt-2" />

      <AnnoSpec rows={[
        ["Status",      <><span className="tok-coral tok">NEW · approved in scoping</span> · ship as <code>SectionComparison.tsx</code> · placed between §5 and §6</>],
        ["Tone",        <>Honest — Instacart wins “cash today”, MomFluence wins “recurring + no audience” · v6 voice: plainspoken, no put-downs</>],
        ["Responsive",  <><span className="tok">hidden md:block</span> table; cards on mobile (<code>&lt; 768px</code>) — both reveal as one block</>],
        ["Our column",  <><span className="tok-coral tok">bg-coral-50/60</span> body cells · header <span className="tok-coral tok">bg-coral-50 ring-1 ring-coral-200 · text-coral-700</span> with coral dot</>],
        ["Citations",   <>Footnote sentence credits public reporting · keep this voice — “Numbers reflect typical reported earnings, not guarantees”</>],
        ["Events",      <>Add <code>LP_SECTION_EVENTS.Comparison</code> to <code>lib/funnel-lab/lp-events.ts</code> before merging</>],
      ]} />
    </Section>
  );
}

window.SectionComparison = SectionComparison;
