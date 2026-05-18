/* global React, Reveal, Section, AnnoSpec, Eyebrow, EarningsDisclaimer, AssetSlot, Anno */
/**
 * §4 — Inside the dashboard
 * Source: components/landing/sections/SectionDashboardTour.tsx
 * Event:  LP_Section_DashboardTour
 *
 * Phase 1: <DashboardPreview /> recreation (CSS-only, faithful to v1 markup).
 * Phase 2: 4-5 annotated production screenshots from app.momfluence.app/dashboard
 *          → /public/lp-baseline/dashboard/{brand-picker,link-generator,earnings,cashout}.png
 *
 * The four numbered callouts ARE the spec — design agent annotates the
 * production screenshots to match these step labels.
 */
const FEATURES = [
  { n: 1, title: "Brand picker",
    body: "Browse 20+ curated brand programs. Filter by vertical — streaming, beauty, savings apps, family safety. Each program shows the commission, what the brand pays, and what you take home.",
    slug: "brand-picker" },
  { n: 2, title: "One-click link generator",
    body: "Pick a brand, generate your tracked link in one tap. Copy to clipboard, paste anywhere. Each link is uniquely tied to your account so clicks attribute correctly.",
    slug: "link-generator" },
  { n: 3, title: "Live earnings & clicks",
    body: "Every click on every link, in real time. See which channels and which brands are converting for you. Updated within minutes of the click.",
    slug: "earnings" },
  { n: 4, title: "Fast-track first cashout",
    body: "Most affiliate programs make you wait 60-90 days for your first payout. Our $25 fast-track lands in your dashboard same-day so you can verify it’s real.",
    slug: "cashout" },
];

function Stat({ label, value, delta }) {
  return (
    <div className="rounded-xl bg-navy-50 p-3 ring-1 ring-navy-100">
      <p className="text-[10px] uppercase tracking-wider text-navy-500">{label}</p>
      <p className="mt-1 text-2xl font-display font-bold text-navy-900">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">{delta}</p>
    </div>
  );
}
function Bar({ h }) { return <div className="w-2.5 rounded-t bg-coral-400" style={{ height: `${h}%` }} />; }
function EarningRow({ brand, mark, color, amount, when }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${color}`}>{mark}</span>
        <div className="leading-tight">
          <p className="text-[12px] font-semibold text-navy-800">{brand}</p>
          <p className="text-[10px] text-navy-500">{when}</p>
        </div>
      </div>
      <p className="text-[12px] font-semibold text-emerald-600">+{amount}</p>
    </div>
  );
}

function DashboardPreview() {
  const heights = [22, 38, 28, 55, 42, 70, 88];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="relative w-full max-w-md">
      <div className="rounded-2xl bg-white shadow-xl ring-1 ring-navy-100">
        <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-navy-100 bg-navy-50/60 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          <span className="ml-3 truncate rounded-md bg-white px-2 py-0.5 text-[10px] text-navy-500 ring-1 ring-navy-100">momfluence.app/dashboard</span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-navy-500">This week</p>
              <h3 className="mt-0.5 text-lg font-display font-bold text-navy-900">Hi Jess 👋</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">$5/mo · active</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Clicks" value="68" delta="↑ 24%" />
            <Stat label="Sign-ups" value="12" delta="↑ 18%" />
            <Stat label="Earned" value="$72" delta="↑ 31%" />
          </div>
          <div className="mt-4 rounded-xl bg-navy-50/60 p-3 ring-1 ring-navy-100">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-semibold text-navy-700">Earnings · last 7 days</p>
              <p className="text-[11px] font-semibold text-coral-600">$72.40</p>
            </div>
            <div className="mt-3 flex h-16 items-end justify-between gap-1.5">
              {heights.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <Bar h={h} />
                  <span className="text-[9px] text-navy-400">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-navy-700">Recent earnings</p>
            <div className="mt-1 divide-y divide-navy-100">
              <EarningRow brand="HBO Max" mark="M" color="bg-purple-700" amount="$24.00" when="2h ago" />
              <EarningRow brand="Sephora" mark="S" color="bg-black"      amount="$18.50" when="yesterday" />
              <EarningRow brand="Target"  mark="T" color="bg-red-600"    amount="$15.00" when="Mon" />
              <EarningRow brand="Hulu"    mark="h" color="bg-green-500"  amount="$14.90" when="Sun" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-coral-50 px-3 py-2 ring-1 ring-coral-200">
            <p className="text-[11px] font-semibold text-coral-700">Next payout · Friday</p>
            <p className="text-[12px] font-bold text-coral-700">$72.40 → Venmo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionDashboardTour() {
  return (
    <Section id="inside-the-dashboard" n="4" name="Inside the dashboard" file="sections/SectionDashboardTour.tsx" event="LP_Section_DashboardTour">
      <Reveal>
        <Eyebrow>Inside the $5/mo membership</Eyebrow>
        <h2 className="mt-2 text-3xl sm:text-4xl text-navy-900 text-balance">Your dashboard does the bragging.</h2>
        <p className="mt-3 text-base sm:text-lg text-navy-600 max-w-2xl">
          The second you’re in, you see exactly what’s happening: clicks, signups, dollars earned this week.
          No guessing, no chasing brands, no spreadsheets.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal scale className="flex justify-center relative">
          <div>
            <DashboardPreview />
            <EarningsDisclaimer density="compact" className="mt-3 text-center" />
            <Anno side="bottom-right">Phase 1 · CSS mock · swap for screenshot in Phase 2</Anno>
          </div>
        </Reveal>

        <ol className="space-y-6">
          {FEATURES.map((f, i) => (
            <Reveal as="li" key={f.n} dir="right" delay={i * 80} className="flex items-start gap-4 relative">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-100 text-base font-bold text-coral-700">{f.n}</span>
              <div className="min-w-0">
                <h3 className="text-lg text-navy-900 font-semibold">{f.title}</h3>
                <p className="mt-2 text-base text-navy-700">{f.body}</p>
                <p className="mt-1 text-[10.5px] font-mono text-coral-700 anno">
                  → screenshot slot: <code>/lp-baseline/dashboard/{f.slug}.png</code>
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>

      {/* Production screenshot reservation grid */}
      <Reveal className="mt-12">
        <Eyebrow tone="navy">Phase 2 — annotated production screenshots</Eyebrow>
        <p className="mt-2 text-sm text-navy-600 max-w-3xl">
          Capture from <code className="text-[11px] font-mono">app.momfluence.app/dashboard</code> at 1440 viewport, mask any PII, drop into <code className="text-[11px] font-mono">/public/lp-baseline/dashboard/</code>.
          Each screenshot gets a coral arrow + matching step number callout in Figma before export.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <AssetSlot key={f.slug} label={`Step ${f.n}`} name={f.title} dims="≈ 720 × 480" height={150}>
              <code className="text-[10px] font-mono text-navy-500 mt-1 font-normal normal-case tracking-normal">{f.slug}.png</code>
            </AssetSlot>
          ))}
        </div>
      </Reveal>

      <AnnoSpec rows={[
        ["Phase 1",      <>CSS mock (this preview) — already in repo as <code>DashboardPreview.tsx</code></>],
        ["Phase 2",      <>Annotated screenshots · capture at 1440 viewport · PII masked · brand logos visible</>],
        ["Layout",       <><span className="tok">grid-cols-1 lg:grid-cols-2</span> · phone stacks above features on mobile</>],
        ["Callouts",     <>Numbered chips <span className="tok-coral tok">bg-coral-100 · text-coral-700 · h-9 w-9 rounded-full</span> · stagger <span className="tok">delay: 0.08 * i</span></>],
        ["Asset paths",  <><code>/public/lp-baseline/dashboard/brand-picker.png</code> · <code>link-generator.png</code> · <code>earnings.png</code> · <code>cashout.png</code></>],
        ["FTC",          <>Compact disclaimer under the dashboard preview · earnings shown ($72/wk) are explicitly example data</>],
      ]} />
    </Section>
  );
}

window.SectionDashboardTour = SectionDashboardTour;
