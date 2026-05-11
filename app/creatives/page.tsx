import type { Metadata } from "next";
import BrandRibbon from "@/components/landing/BrandRibbon";
import { VARIANTS } from "@/lib/funnel-lab/variants";

export const metadata: Metadata = {
  title: "Creative Lab — internal",
  robots: { index: false, follow: false },
};

type AdSpec = {
  primary: string;
  headline: string;
  description: string;
  cta: "Sign Up" | "Get Offer" | "Learn More" | "Subscribe";
};

function Spec({ angle, target, format, ad }: {
  angle: string;
  target: string;
  format: "1080×1080 (1:1)" | "1080×1920 (9:16)" | "Video script";
  ad: AdSpec;
}) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-navy-100 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-navy-900 px-2.5 py-1 font-bold uppercase tracking-wider text-white">
          {format}
        </span>
        <span className="rounded-full bg-coral-100 px-2.5 py-1 font-semibold uppercase tracking-wider text-coral-700">
          {angle}
        </span>
        <span className="rounded-full bg-navy-50 px-2.5 py-1 font-semibold uppercase tracking-wider text-navy-600 ring-1 ring-navy-100">
          target: {target}
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top w-32">Primary text</td>
            <td className="py-1.5 text-navy-800">{ad.primary}</td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Headline</td>
            <td className="py-1.5 text-navy-800">{ad.headline}</td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Description</td>
            <td className="py-1.5 text-navy-800">{ad.description}</td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">CTA</td>
            <td className="py-1.5"><span className="rounded bg-navy-900 px-2 py-0.5 text-xs font-bold text-white">{ad.cta}</span></td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Destination</td>
            <td className="py-1.5 font-mono text-xs text-navy-700">/signup</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VariantSpec({ slug, creativeId }: { slug: string; creativeId: string }) {
  const v = VARIANTS.find((x) => x.slug === slug);
  if (!v) return null;
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-navy-100 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-navy-900 px-2.5 py-1 font-bold uppercase tracking-wider text-white">
          1080×1080 (1:1)
        </span>
        <span className="rounded-full bg-coral-100 px-2.5 py-1 font-semibold uppercase tracking-wider text-coral-700">
          {v.angle}
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
          LP-paired
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top w-32">Variant slug</td>
            <td className="py-1.5 font-mono text-xs text-navy-800">{v.slug}</td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Hypothesis</td>
            <td className="py-1.5 italic text-navy-700">{v.hypothesis}</td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Headline (LP)</td>
            <td className="py-1.5 whitespace-pre-line text-navy-800">{v.hero.headline}</td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">CTA</td>
            <td className="py-1.5">
              <span className="rounded bg-navy-900 px-2 py-0.5 text-xs font-bold text-white">
                {v.hero.ctaPrimary}
              </span>
            </td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Funnel</td>
            <td className="py-1.5 font-mono text-xs text-navy-700">{v.funnel}</td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Destination</td>
            <td className="py-1.5 font-mono text-xs text-navy-700">
              /lp/{v.slug}?c={creativeId}
            </td>
          </tr>
          <tr className="border-t border-navy-100">
            <td className="py-1.5 pr-3 font-semibold text-navy-700 align-top">Stripe metadata</td>
            <td className="py-1.5 font-mono text-[11px] text-navy-700">
              lp_variant={v.slug} · creative_id={creativeId}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CreativeFrame({ children, w, h, scale }: {
  children: React.ReactNode;
  w: number;
  h: number;
  scale: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-navy-50 ring-2 ring-navy-200 shadow-lg"
      style={{ width: w * scale, height: h * scale }}
    >
      <div
        data-creative-export="1"
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Block({ num, title, hook, children }: {
  num: number;
  title: string;
  hook: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-5xl font-bold text-coral-500">#{num}</span>
        <h2 className="text-2xl text-navy-900">{title}</h2>
      </div>
      <p className="mt-1 text-sm italic text-navy-500">Hook angle: {hook}</p>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[auto_1fr]">
        {children}
      </div>
    </section>
  );
}

const FEED_W = 1080;
const FEED_H = 1080;
const STORY_W = 1080;
const STORY_H = 1920;
const FEED_SCALE = 0.4;   // 432×432 preview
const STORY_SCALE = 0.25; // 270×480 preview

export default function CreativeLab() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
        Internal · creative lab
      </p>
      <h1 className="mt-2 text-4xl text-navy-900">10 cold-traffic ad creatives for Andromeda</h1>
      <p className="mt-4 text-base text-navy-700">
        Designed for super-broad mom targeting on Meta. Each creative tests a
        distinct angle so Andromeda&apos;s creative-led targeting can pick winners.
        Target: ≤ $5 day-1 breakeven CPA on the SignupStarted/Purchase event.
      </p>

      <div className="mt-8 rounded-2xl bg-navy-900 p-6 text-white ring-1 ring-navy-700">
        <h2 className="text-xl text-white">How to export</h2>
        <ol className="mt-3 space-y-2 text-sm text-navy-100">
          <li>1. Right-click the creative preview → <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Inspect</span></li>
          <li>2. In the Elements panel, find the element with <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">data-creative-export=&quot;1&quot;</span></li>
          <li>3. Click the <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⋮</span> menu next to that element → <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Capture node screenshot</span></li>
          <li>4. PNG saves at native resolution (1080×1080 or 1080×1920) — drop directly into Meta Ads Manager</li>
        </ol>
        <p className="mt-3 text-xs text-navy-300">
          Alt: in DevTools, set device toolbar to 1080-wide and screenshot the page. Or use the
          Chrome &quot;Capture full size screenshot&quot; trick after disabling responsive mode.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-coral-50 p-6 ring-1 ring-coral-200">
        <h2 className="text-xl text-navy-900">Recommended Meta setup</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-navy-800">
          <li>→ <span className="font-semibold">Campaign objective:</span> Sales (or Engagement → SignupStarted custom event)</li>
          <li>→ <span className="font-semibold">Targeting:</span> Women, 28–55, US — no interests (let Andromeda pick)</li>
          <li>→ <span className="font-semibold">Optimization:</span> Conversions (Purchase event from v2 pixel via Stape CAPIG)</li>
          <li>→ <span className="font-semibold">Budget:</span> $20–50/day per ad set, run all 10 creatives in one ad set so Meta picks winners</li>
          <li>→ <span className="font-semibold">Placements:</span> Advantage+ (let Meta serve everywhere — feed, Reels, Stories)</li>
          <li>→ <span className="font-semibold">Cost cap:</span> $5 (matches your day-1 breakeven)</li>
        </ul>
      </div>

      {/* ============================================================ */}
      {/* CREATIVE 1 — Big Number Hero */}
      {/* ============================================================ */}
      <Block num={1} title="Big Number Hero" hook="aspirational stat → curiosity">
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="relative h-full w-full bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-16 text-white">
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-coral-500 opacity-20 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-coral-400 opacity-10 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <div>
                <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-300">
                  MomFluence
                </p>
                <p className="mt-6 font-display text-5xl leading-tight text-navy-100">
                  I sent 4 texts last week.
                  <br />
                  This is what happened.
                </p>
              </div>

              <div className="my-auto text-center">
                <p className="text-2xl uppercase tracking-[0.25em] text-navy-300">
                  earned this week
                </p>
                <p className="mt-2 font-display text-[260px] font-bold leading-none text-white">
                  $387<span className="text-coral-300">.50</span>
                </p>
                <p className="mt-2 text-2xl text-navy-200">
                  recurring brand commissions · not refer-a-friend
                </p>
              </div>

              <div className="mt-auto rounded-2xl bg-coral-500 px-8 py-6 ring-2 ring-coral-300">
                <div className="flex items-center justify-between">
                  <p className="font-display text-3xl font-bold">$5/mo · cancel anytime</p>
                  <p className="text-2xl font-bold">momfluence.app →</p>
                </div>
              </div>
            </div>
          </div>
        </CreativeFrame>
        <Spec
          angle="Aspirational stat"
          target="busy moms / side-income curious"
          format="1080×1080 (1:1)"
          ad={{
            primary: "Sent 4 texts to my group chat last week. Earned $387. This isn't refer-a-friend bonus money — it's recurring commission from real brands (HBO Max, Sephora, Target, Hulu, etc). Costs $5/mo. Cancel anytime.",
            headline: "Real moms. Real brand cash.",
            description: "$5/mo. First $25 day one.",
            cta: "Sign Up",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 2 — Refer vs Partnership Compare */}
      {/* ============================================================ */}
      <Block num={2} title="Refer-a-Friend vs Partnership" hook="education / objection bust">
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="h-full w-full bg-white p-16">
            <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
              Most moms think these are the same.
            </p>
            <p className="mt-3 font-display text-6xl leading-tight text-navy-900">
              They&apos;re not even close.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="rounded-3xl bg-navy-100 p-10 ring-2 ring-navy-200">
                <p className="text-xl font-bold uppercase tracking-widest text-navy-500">
                  &ldquo;Refer a friend&rdquo;
                </p>
                <p className="mt-6 font-display text-7xl font-bold text-navy-700">
                  $10
                </p>
                <p className="mt-2 text-2xl font-semibold text-navy-600">once. ever.</p>
                <ul className="mt-8 space-y-3 text-xl text-navy-600">
                  <li>✗ One-time tip</li>
                  <li>✗ Same offer everywhere</li>
                  <li>✗ Dies on cancel</li>
                </ul>
              </div>
              <div className="rounded-3xl bg-coral-500 p-10 text-white ring-2 ring-coral-400 shadow-2xl">
                <p className="text-xl font-bold uppercase tracking-widest text-coral-100">
                  Partnership link
                </p>
                <p className="mt-6 font-display text-6xl font-bold">
                  20–60%
                </p>
                <p className="mt-2 text-2xl font-semibold text-coral-50">every month. recurring.</p>
                <ul className="mt-8 space-y-3 text-xl text-coral-50">
                  <li>✓ % of every sub she pays</li>
                  <li>✓ Sometimes for life</li>
                  <li>✓ Exclusive access</li>
                </ul>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between rounded-xl bg-navy-900 px-8 py-6 text-white">
              <p className="font-display text-3xl font-bold">MomFluence · $5/mo</p>
              <p className="text-2xl">First $25 unlocks day one →</p>
            </div>
          </div>
        </CreativeFrame>
        <Spec
          angle="Education / objection"
          target="skeptical moms / been-burned-before"
          format="1080×1080 (1:1)"
          ad={{
            primary: "Heads up — most moms confuse \"refer a friend\" with what we do, and it costs them. Refer-a-friend = $10 once. MomFluence partnership links = 20–60% of every monthly subscription, sometimes for life. Big difference between a tip and a recurring paycheck.",
            headline: "Not a refer-a-friend link.",
            description: "20–60% recurring vs. $10 once.",
            cta: "Learn More",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 3 — Brand Wall */}
      {/* ============================================================ */}
      <Block num={3} title="Brand Wall" hook="status / brand recognition">
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col bg-gradient-to-b from-coral-50 to-white p-16">
            <div className="text-center">
              <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
                Get paid when your friends shop at:
              </p>
            </div>

            <div className="my-12 grid grid-cols-3 gap-5">
              {[
                { n: "Sephora", m: "S", bg: "bg-black", fg: "text-white" },
                { n: "Target", m: "T", bg: "bg-red-600", fg: "text-white" },
                { n: "Walmart", m: "W", bg: "bg-blue-600", fg: "text-yellow-300" },
                { n: "HBO Max", m: "M", bg: "bg-purple-700", fg: "text-white" },
                { n: "Hulu", m: "h", bg: "bg-green-500", fg: "text-white" },
                { n: "Netflix", m: "N", bg: "bg-red-700", fg: "text-white" },
                { n: "Amazon", m: "a", bg: "bg-[#232f3e]", fg: "text-orange-400" },
                { n: "Nordstrom", m: "N", bg: "bg-navy-900", fg: "text-white" },
                { n: "Disney+", m: "D", bg: "bg-blue-800", fg: "text-white" },
              ].map((b) => (
                <div
                  key={b.n}
                  className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-2 ring-navy-100 shadow-sm"
                >
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${b.bg} ${b.fg}`}
                  >
                    {b.m}
                  </span>
                  <span className="text-3xl font-bold text-navy-900">{b.n}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-2xl bg-navy-900 p-8 text-center text-white">
              <p className="font-display text-4xl font-bold">+ 50 more partner brands</p>
              <p className="mt-2 text-2xl text-navy-200">$5/mo to access · momfluence.app</p>
            </div>
          </div>
        </CreativeFrame>
        <Spec
          angle="Brand status / recognition"
          target="moms who already shop these / aspirational"
          format="1080×1080 (1:1)"
          ad={{
            primary: "Quick question for the moms — do you already buy stuff from Sephora, Target, Walmart, HBO Max, Hulu? Of course you do. MomFluence pays you a recurring commission every time a friend signs up to one of those (50+ partner brands). $5/mo membership. Cancel anytime.",
            headline: "Sephora. Target. HBO Max.",
            description: "50+ brands paying recurring %.",
            cta: "Sign Up",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 4 — Dashboard Payoff */}
      {/* ============================================================ */}
      <Block num={4} title="Dashboard Payoff" hook="proof / receipts">
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="h-full w-full bg-gradient-to-br from-navy-900 to-navy-700 p-16 text-white">
            <div>
              <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-300">
                MomFluence
              </p>
              <p className="mt-4 font-display text-5xl leading-tight">
                This is what mom-money
                <br />
                looks like in 2026.
              </p>
            </div>

            <div className="mt-10 rounded-3xl bg-white p-10 text-navy-900 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg uppercase tracking-widest text-navy-500">
                    This week
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold">Hi Jess 👋</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-base font-bold text-emerald-700 ring-1 ring-emerald-200">
                  $5/mo · active
                </span>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-navy-50 p-5 ring-1 ring-navy-100">
                  <p className="text-sm uppercase tracking-wider text-navy-500">Clicks</p>
                  <p className="mt-1 font-display text-5xl font-bold">68</p>
                  <p className="text-base font-semibold text-emerald-600">↑ 24%</p>
                </div>
                <div className="rounded-2xl bg-navy-50 p-5 ring-1 ring-navy-100">
                  <p className="text-sm uppercase tracking-wider text-navy-500">Sign-ups</p>
                  <p className="mt-1 font-display text-5xl font-bold">12</p>
                  <p className="text-base font-semibold text-emerald-600">↑ 18%</p>
                </div>
                <div className="rounded-2xl bg-coral-50 p-5 ring-2 ring-coral-300">
                  <p className="text-sm uppercase tracking-wider text-coral-600">Earned</p>
                  <p className="mt-1 font-display text-5xl font-bold text-coral-700">$72</p>
                  <p className="text-base font-semibold text-emerald-600">↑ 31%</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl bg-coral-500 px-5 py-4 text-white">
                <p className="text-lg font-bold">Friday payout</p>
                <p className="text-lg font-bold">$72.40 → Venmo</p>
              </div>
            </div>

            <p className="mt-8 text-center text-2xl text-navy-200">
              Set up in 4 minutes. Earn while school&apos;s in.
            </p>
          </div>
        </CreativeFrame>
        <Spec
          angle="Proof / receipts"
          target="show-me-the-money moms / skeptics"
          format="1080×1080 (1:1)"
          ad={{
            primary: "Receipts from my dashboard this week: 68 clicks, 12 sign-ups, $72 earned. Took 4 minutes to set up, $5/mo to keep active. I shared 3 brand links in my mom group chat. That's it. That's the post.",
            headline: "$72 in a week from texting.",
            description: "Set up in 4 min. $5/mo.",
            cta: "Get Offer",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 5 — ChatGPT Writes It */}
      {/* ============================================================ */}
      <Block num={5} title="ChatGPT Writes It" hook="empowerment / not-a-creator angle">
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="h-full w-full bg-white p-12">
            <p className="text-center text-2xl font-bold uppercase tracking-[0.15em] text-coral-600">
              POV: you&apos;re &ldquo;not a creator&rdquo;
            </p>
            <p className="mt-3 text-center font-display text-6xl font-bold leading-tight text-navy-900">
              Doesn&apos;t matter.
              <br />
              ChatGPT writes the post.
            </p>

            <div className="mt-10 rounded-3xl bg-navy-900 p-8 text-white shadow-2xl">
              <div className="flex items-center gap-3 border-b border-navy-700 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl">✱</span>
                <p className="text-2xl font-semibold">ChatGPT</p>
              </div>

              <div className="mt-5 rounded-2xl bg-navy-700 px-5 py-4 text-xl">
                Write 5 TikTok hooks for a mom recommending HBO Max. Casual, curious tone.
              </div>

              <div className="mt-5 rounded-2xl bg-coral-500 px-5 py-5 text-xl leading-snug">
                <p className="mb-3 text-base font-semibold uppercase tracking-widest text-coral-100">
                  Output · 6.2s
                </p>
                <p className="mb-3"><span className="font-bold">1.</span> &ldquo;I&apos;m a mom of 3 and I haven&apos;t been excited about a TV show in years. Then I started this last week…&rdquo;</p>
                <p className="mb-3"><span className="font-bold">2.</span> &ldquo;Bought $12.99 of HBO Max. Best decision I&apos;ve made all month. Here&apos;s why.&rdquo;</p>
                <p><span className="font-bold">3.</span> &ldquo;Tell me your favorite genre — I&apos;ll tell you which Max show to start tonight.&rdquo;</p>
                <p className="mt-3 text-base text-coral-100">+ 2 more hooks</p>
              </div>
            </div>

            <p className="mt-6 text-center text-2xl text-navy-700">
              Pick a brand. Copy the prompt. Paste. Done.
              <br />
              <span className="font-bold text-coral-600">$5/mo · momfluence.app</span>
            </p>
          </div>
        </CreativeFrame>
        <Spec
          angle="Empowerment / AI"
          target="non-creators / hesitant about content"
          format="1080×1080 (1:1)"
          ad={{
            primary: "If you can copy & paste, you can do this. We give you the brand link AND the ChatGPT prompt. ChatGPT writes the TikTok hook (or the Reddit post, or the blog draft) in 6 seconds. You post it, get paid recurring commission when someone signs up. $5/mo to access.",
            headline: "ChatGPT writes the post.",
            description: "You collect the check.",
            cta: "Sign Up",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 6 — Not MLM / Anti-Skeptic */}
      {/* ============================================================ */}
      <Block num={6} title="It's Not MLM" hook="skepticism bust / safety">
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col justify-between bg-white p-16">
            <div>
              <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
                Real talk for skeptical moms ↓
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-display text-7xl font-bold leading-tight text-navy-300 line-through decoration-coral-500 decoration-[6px]">
                It&apos;s not MLM.
              </p>
              <p className="font-display text-7xl font-bold leading-tight text-navy-300 line-through decoration-coral-500 decoration-[6px]">
                It&apos;s not a side hustle scheme.
              </p>
              <p className="font-display text-7xl font-bold leading-tight text-navy-300 line-through decoration-coral-500 decoration-[6px]">
                It&apos;s not refer-a-friend.
              </p>
              <p className="font-display text-7xl font-bold leading-tight text-navy-900 mt-4">
                It&apos;s just <span className="text-coral-600">brand affiliate links</span> from places you already shop.
              </p>
            </div>

            <div className="rounded-2xl bg-navy-900 p-8 text-white">
              <div className="flex items-center justify-between">
                <p className="font-display text-4xl font-bold">$5/mo to access. $25 cashout day one.</p>
                <p className="text-2xl">momfluence.app →</p>
              </div>
            </div>
          </div>
        </CreativeFrame>
        <Spec
          angle="Skepticism bust"
          target="MLM-burned / scam-wary moms"
          format="1080×1080 (1:1)"
          ad={{
            primary: "I know what you're thinking. It's not MLM. Not a side-hustle scheme. Not refer-a-friend. It's just affiliate links — same thing every blogger and YouTuber uses — but for real brands you already shop. $5/mo to access. $25 cashout day one. Cancel anytime, no weird strings.",
            headline: "Not MLM. Just affiliate links.",
            description: "From brands you already shop.",
            cta: "Learn More",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 7 — iMessage Screenshot (9:16) */}
      {/* ============================================================ */}
      <Block num={7} title="iMessage Screenshot" hook="relatability / proof">
        <CreativeFrame w={STORY_W} h={STORY_H} scale={STORY_SCALE}>
          <div className="relative h-full w-full bg-gradient-to-b from-coral-100 via-coral-50 to-white p-14">
            <div className="text-center">
              <p className="font-display text-7xl font-bold leading-tight text-navy-900">
                My group chat
                <br />
                just paid me $24.
              </p>
              <p className="mt-4 text-3xl text-navy-600">no, really.</p>
            </div>

            <div className="mx-auto mt-10 w-[640px] rounded-[3.5rem] bg-navy-900 p-3 shadow-2xl">
              <div className="relative overflow-hidden rounded-[3rem] bg-white">
                <div className="absolute left-1/2 top-3 h-7 w-32 -translate-x-1/2 rounded-full bg-navy-900" />
                <div className="px-8 pt-3 pb-2 text-center text-base font-semibold text-navy-700">9:41 · iMessage</div>
                <div className="border-y border-navy-100 bg-white px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-100 text-xl font-bold text-coral-700">J</span>
                    <p className="text-2xl font-bold text-navy-900">Jess</p>
                  </div>
                </div>

                <div className="space-y-3 bg-[#fafbfc] p-6">
                  <div className="max-w-[80%] self-start rounded-[1.75rem] rounded-bl-md bg-navy-100 px-5 py-4 text-2xl text-navy-900">
                    ok i&apos;m so bored tonight 😩 anything good to watch??
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-[1.75rem] rounded-br-md bg-[#34b7f1] px-5 py-4 text-2xl text-white">
                    omg YES — start <em>The Pitt</em> on Max. just finished s1 🙌
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-[1.75rem] rounded-br-md bg-[#34b7f1] px-5 py-4 text-2xl text-white">
                    here&apos;s my link if you sign up — momflu.cc/jess 💖
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-12 top-[55%] rotate-12 rounded-2xl bg-coral-500 px-6 py-4 text-white shadow-2xl ring-4 ring-coral-200">
              <p className="text-xl font-bold uppercase">earned</p>
              <p className="font-display text-5xl font-bold">+$24.00</p>
            </div>

            <div className="absolute bottom-14 left-14 right-14 rounded-2xl bg-navy-900 p-7 text-white">
              <p className="text-center font-display text-4xl font-bold">
                MomFluence · $5/mo · day-one $25 fast-track
              </p>
              <p className="mt-2 text-center text-2xl text-navy-200">momfluence.app →</p>
            </div>
          </div>
        </CreativeFrame>
        <Spec
          angle="Relatability / proof"
          target="texting moms / mom group chats"
          format="1080×1920 (9:16)"
          ad={{
            primary: "Sent one text to my friend Jess about The Pitt on Max. She watched it, signed up through my link, I just got $24. This is MomFluence. It's literally just texting brand recs to friends — except now you get paid recurring %. $5/mo. Cancel anytime.",
            headline: "Texted a show rec. Got paid.",
            description: "$5/mo. Recurring commissions.",
            cta: "Sign Up",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 8 — Venmo Notification Stack (9:16) */}
      {/* ============================================================ */}
      <Block num={8} title="Venmo Stack" hook="cashout receipts / lock-screen pattern">
        <CreativeFrame w={STORY_W} h={STORY_H} scale={STORY_SCALE}>
          <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-navy-900 to-navy-800 p-14 text-white">
            <p className="text-center text-2xl font-bold uppercase tracking-[0.2em] text-coral-300">
              Friday afternoons · MomFluence
            </p>

            <div className="my-auto space-y-5">
              {[
                { brand: "Sephora", amount: "$18.50", time: "2:41 PM" },
                { brand: "HBO Max", amount: "$24.00", time: "2:42 PM" },
                { brand: "Target",  amount: "$15.00", time: "2:42 PM" },
                { brand: "Hulu",    amount: "$14.90", time: "2:43 PM" },
              ].map((n) => (
                <div
                  key={n.brand}
                  className="rounded-3xl bg-white/95 p-7 text-navy-900 shadow-2xl backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-500 text-2xl font-bold text-white">$</span>
                      <div>
                        <p className="text-xl font-bold">MomFluence</p>
                        <p className="text-base text-navy-500">commission · {n.brand}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl font-bold text-emerald-600">
                        +{n.amount}
                      </p>
                      <p className="text-sm text-navy-400">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-auto text-center font-display text-6xl font-bold leading-tight">
              = $72.40 from
              <br />
              <span className="text-coral-300">recommending stuff I love.</span>
            </p>
            <p className="mt-6 text-center text-2xl text-navy-200">
              MomFluence · $5/mo · momfluence.app
            </p>
          </div>
        </CreativeFrame>
        <Spec
          angle="Cashout receipts"
          target="show-me-the-money moms / Venmo-fluent"
          format="1080×1920 (9:16)"
          ad={{
            primary: "Friday afternoons hit different. $72.40 in MomFluence commissions across 4 brands I literally just texted friends about (Sephora, HBO Max, Target, Hulu). It's recurring — same friends pay me again next month, and the next. $5/mo to access.",
            headline: "Friday cashouts, every week.",
            description: "$5/mo. $25 day-one fast-track.",
            cta: "Get Offer",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 9 — UGC Video Script */}
      {/* ============================================================ */}
      <Block num={9} title="UGC Selfie Video — &ldquo;I tried this for a week&rdquo;" hook="UGC / week-of-experiment">
        <div className="rounded-2xl bg-white p-8 ring-2 ring-navy-200 shadow-lg">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-coral-600">
            Format · 9:16 · 30 seconds · selfie shot, kitchen or car
          </p>

          <div className="space-y-5 text-sm">
            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:00–0:03] HOOK · text overlay: &ldquo;I tried this $5 mom-thing for a week. Receipts.&rdquo;</p>
              <p className="mt-1 italic text-navy-600">&ldquo;Ok so my sister sent me this thing called MomFluence — basically you share brand links and get paid every time someone signs up. I was skeptical. Five dollars a month? Sounds like a scam.&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:04–0:09] CONFLICT · text overlay: &ldquo;day 1: doubting myself&rdquo;</p>
              <p className="mt-1 italic text-navy-600">&ldquo;Day one, I picked HBO Max from my dashboard. Asked ChatGPT to write me a TikTok hook about it. Posted. Sent the link to my mom group chat too. Honestly thought nothing would happen.&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:10–0:18] PIVOT · screen recording cut-in of dashboard</p>
              <p className="mt-1 italic text-navy-600">&ldquo;Day three I check my dashboard. 12 clicks. Three sign-ups. $36 earned. <span className="font-semibold">Recurring</span> — I keep getting paid every month they stay subscribed. From three texts.&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:19–0:25] PROOF · text overlay: &ldquo;week 1 total: $72.40&rdquo;</p>
              <p className="mt-1 italic text-navy-600">&ldquo;End of the week I&apos;d earned $72.40. From a $5 monthly fee and basically zero effort. The fast-track payout unlocked at $25 — that came day one. The rest cleared at $50.&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:26–0:30] CTA · text overlay: &ldquo;link in bio · momfluence.app&rdquo;</p>
              <p className="mt-1 italic text-navy-600">&ldquo;Anyway. If your group chat already asks you for recs, you&apos;re leaving money on the table. Five bucks. Cancel anytime. Link&apos;s in my bio.&rdquo;</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-navy-50 p-4 text-xs text-navy-700">
            <p className="font-bold text-navy-900">Production notes for creator</p>
            <ul className="mt-2 space-y-1">
              <li>→ Shoot in good natural light (kitchen window, parked car). No makeup/hair fuss — feels real.</li>
              <li>→ Cut between selfie and a screen recording of the dashboard at [0:10] for visual proof.</li>
              <li>→ Captions throughout — most viewers watch muted.</li>
              <li>→ Trending audio under the voiceover at low volume (10–15%).</li>
              <li>→ End frame: stable shot of the dashboard with the $72.40 visible for 1.5s before fade.</li>
            </ul>
          </div>
        </div>
        <Spec
          angle="UGC / week-experiment"
          target="UGC-trusting moms / TikTok-native"
          format="Video script"
          ad={{
            primary: "I tried this $5/mo mom-thing for a week. Sharing the receipts. (Sister sent it to me — I was skeptical.) End of the week: $72.40 from texting friends about brands I already use. The fast-track payout unlocked at $25, day one. Anyway, link's in bio if your group chat already asks you for recs.",
            headline: "I tried this for a week.",
            description: "$72 from texting friends.",
            cta: "Sign Up",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* CREATIVE 10 — UGC Dashboard Walkthrough */}
      {/* ============================================================ */}
      <Block num={10} title="UGC Screen Walkthrough — &ldquo;let me show you my dashboard&rdquo;" hook="UGC / behind-the-scenes proof">
        <div className="rounded-2xl bg-white p-8 ring-2 ring-navy-200 shadow-lg">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-coral-600">
            Format · 9:16 · 22 seconds · phone screen recording with voiceover
          </p>

          <div className="space-y-5 text-sm">
            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:00–0:02] HOOK · screen rec opens to MomFluence dashboard</p>
              <p className="mt-1 italic text-navy-600">&ldquo;Stop scrolling. Let me show you what $5 a month gets you.&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:03–0:08] STAT REVEAL · pinch-zoom into &ldquo;$72 earned&rdquo; tile</p>
              <p className="mt-1 italic text-navy-600">&ldquo;This is my dashboard from this week. 68 clicks. 12 sign-ups. $72 earned. From sharing four brand links in my mom group chat.&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:09–0:14] EARNINGS LIST · scroll to recent earnings list</p>
              <p className="mt-1 italic text-navy-600">&ldquo;HBO Max paid me $24. Sephora $18. Target $15. Hulu $14. <span className="font-semibold">And these keep paying every month they stay subscribed.</span>&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:15–0:18] AI BIT · cut to ChatGPT generating a hook</p>
              <p className="mt-1 italic text-navy-600">&ldquo;If you&apos;re thinking &lsquo;I&apos;m not a creator&rsquo; — ChatGPT writes the post. Pick a brand, copy the prompt, paste. Done in 6 seconds.&rdquo;</p>
            </div>

            <div className="border-l-4 border-coral-300 pl-4">
              <p className="font-bold text-navy-900">[0:19–0:22] CTA · cut back to dashboard with overlay &ldquo;momfluence.app&rdquo;</p>
              <p className="mt-1 italic text-navy-600">&ldquo;Five bucks a month. First $25 unlocks day one. Link&apos;s in my bio.&rdquo;</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-navy-50 p-4 text-xs text-navy-700">
            <p className="font-bold text-navy-900">Production notes for creator</p>
            <ul className="mt-2 space-y-1">
              <li>→ Record on iPhone with built-in screen recorder (Settings → Control Center → add Screen Recording).</li>
              <li>→ Voiceover after the fact in QuickTime or CapCut — keeps it crisp and punchy.</li>
              <li>→ Use the demo account dashboard so the numbers look real (don&apos;t make them up — Meta&apos;s ad review hates fabricated screenshots).</li>
              <li>→ Captions hard-burned via CapCut auto-captions.</li>
              <li>→ Aspect: shoot vertical, export 1080×1920 H.264 MP4.</li>
            </ul>
          </div>
        </div>
        <Spec
          angle="Behind-the-scenes / proof"
          target="show-me-the-money / detail-oriented moms"
          format="Video script"
          ad={{
            primary: "Stop scrolling — let me show you what $5/mo gets you. This is my MomFluence dashboard this week. 68 clicks, 12 sign-ups, $72 earned from 4 brand links I texted to my mom group chat. And it's recurring — these keep paying every month. ChatGPT writes the post if you're not a creator. Link in bio.",
            headline: "What $5/mo actually buys.",
            description: "Real dashboard. Real numbers.",
            cta: "Sign Up",
          }}
        />
      </Block>

      {/* ============================================================ */}
      {/* Bonus: Brand ribbon for visual reference */}
      {/* ============================================================ */}
      <section className="mt-20 border-t border-navy-100 pt-10">
        <h2 className="text-xl text-navy-900">Brand assets for video creatives</h2>
        <p className="mt-2 text-sm text-navy-600">
          The same brand chip ribbon used on the homepage. Useful as a B-roll
          element in video creatives — screen-record it scrolling and overlay.
        </p>
        <div className="mt-6">
          <BrandRibbon />
        </div>
      </section>

      {/* ============================================================ */}
      {/* FUNNEL LAB — 10 variant-paired creatives (#11–#20) */}
      {/* ============================================================ */}
      <section className="mt-20 border-t border-navy-100 pt-12">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Funnel Lab · v1
        </p>
        <h2 className="text-3xl text-navy-900">
          10 variant-paired creatives → matched landing pages
        </h2>
        <p className="mt-3 text-base text-navy-700">
          Each creative below ships paired with a dedicated landing page at
          {" "}
          <span className="font-mono text-sm">/lp/&lt;slug&gt;</span>{" "}
          tuned to the same psychographic angle. The destination URL carries
          the variant + creative IDs through the funnel so /admin/funnel-lab
          can aggregate signups and Purchase events by combination.
        </p>
        <p className="mt-3 text-sm text-navy-500">
          Lowest-common-denominator copy across all variants — assume zero
          following, zero AI experience, zero affiliate marketing knowledge.
        </p>
      </section>

      {/* #11 — Group Chat is a Goldmine */}
      <Block num={11} title={VARIANTS[0].label} hook={VARIANTS[0].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-amber-50 via-coral-50 to-amber-100 p-14">
            <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-coral-300 opacity-40 blur-3xl" />
            <p className="relative text-2xl font-bold uppercase tracking-[0.2em] text-coral-700">
              No followers required.
            </p>
            <p className="relative mt-4 font-display text-7xl leading-tight text-navy-900">
              Your group chat<br />is a goldmine.
            </p>

            <div className="relative mt-10 rounded-3xl bg-white p-7 shadow-2xl ring-2 ring-navy-100">
              <div className="flex items-center gap-3 border-b border-navy-100 pb-3">
                <div className="flex -space-x-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-200 text-xl font-bold text-coral-700 ring-2 ring-white">J</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-300 text-xl font-bold text-amber-900 ring-2 ring-white">K</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300 text-xl font-bold text-emerald-900 ring-2 ring-white">L</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-200 text-xl font-bold text-navy-900 ring-2 ring-white">+3</span>
                </div>
                <p className="text-xl font-semibold text-navy-900">School moms 📚</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-navy-100 px-4 py-3 text-xl">anyone got a sephora rec?</div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#34b7f1] px-4 py-3 text-xl text-white">omg yes — try this 💖</div>
              </div>
            </div>

            <div className="absolute right-12 bottom-32 rotate-6 rounded-2xl bg-coral-500 px-6 py-4 text-white shadow-2xl ring-4 ring-coral-200">
              <p className="text-base font-bold uppercase">commission</p>
              <p className="font-display text-5xl font-bold">+$18.50</p>
              <p className="text-sm">per month, recurring</p>
            </div>

            <div className="absolute bottom-10 left-14 right-14 rounded-2xl bg-navy-900 p-5 text-white">
              <p className="text-center font-display text-3xl font-bold">MomFluence · $5/mo · momfluence.app/lp/group-chat-goldmine</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="group-chat-goldmine" creativeId="c11" />
      </Block>

      {/* #12 — Make Money Without Being an Influencer */}
      <Block num={12} title={VARIANTS[1].label} hook={VARIANTS[1].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col justify-between bg-white p-14">
            <div>
              <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
                the simplest side income on the internet
              </p>
              <p className="mt-6 font-display text-7xl leading-[1.05] text-navy-900">
                Make money<br />from your phone.
              </p>
              <p className="mt-4 font-display text-6xl leading-tight text-navy-400">
                Without becoming an{" "}
                <span className="relative text-navy-900">
                  influencer
                  <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-coral-500" />
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["no followers", "no camera", "no experience"].map((t) => (
                <div key={t} className="rounded-2xl bg-coral-50 p-5 text-center ring-2 ring-coral-200">
                  <p className="text-xl font-bold uppercase tracking-widest text-coral-700">✓ {t}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-navy-900 p-8 text-center text-white">
              <p className="font-display text-4xl font-bold">Pick a brand → share a link → get paid.</p>
              <p className="mt-2 text-2xl text-navy-200">$5/mo · cancel anytime · momfluence.app</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="no-influencer-needed" creativeId="c12" />
      </Block>

      {/* #13 — Earn Between Drop-off & Pickup */}
      <Block num={13} title={VARIANTS[2].label} hook={VARIANTS[2].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col justify-center bg-gradient-to-br from-blue-50 via-white to-coral-50 p-14">
            <p className="text-center text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
              while the kids are at school
            </p>
            <p className="mt-4 text-center font-display text-7xl leading-tight text-navy-900">
              Earn between<br />drop-off &amp; pickup.
            </p>

            <div className="mt-10 grid grid-cols-3 items-center gap-4">
              <div className="rounded-3xl bg-white p-6 text-center ring-2 ring-navy-100 shadow-md">
                <p className="font-display text-5xl font-bold text-navy-900">8:00 AM</p>
                <p className="mt-1 text-xl text-navy-600">drop-off</p>
              </div>
              <div className="text-center">
                <p className="font-display text-7xl">→</p>
                <p className="font-display text-4xl font-bold text-coral-600">$25</p>
                <p className="text-base text-navy-500">earned</p>
              </div>
              <div className="rounded-3xl bg-white p-6 text-center ring-2 ring-navy-100 shadow-md">
                <p className="font-display text-5xl font-bold text-navy-900">2:30 PM</p>
                <p className="mt-1 text-xl text-navy-600">pickup</p>
              </div>
            </div>

            <p className="mt-10 text-center text-2xl text-navy-700">
              4 minutes to set up · cash out same-day at $25
            </p>

            <div className="mt-8 rounded-2xl bg-navy-900 p-7 text-center text-white">
              <p className="font-display text-3xl font-bold">MomFluence · $5/mo</p>
              <p className="mt-1 text-xl text-navy-200">momfluence.app/lp/school-hours-income</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="school-hours-income" creativeId="c13" />
      </Block>

      {/* #14 — Stealth Income */}
      <Block num={14} title={VARIANTS[3].label} hook={VARIANTS[3].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col justify-between bg-navy-900 p-14 text-white">
            <div>
              <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-300">
                🤫 no awkward dms to friends
              </p>
              <p className="mt-6 font-display text-7xl leading-[1.05]">
                Make money online.<br />
                <span className="text-coral-300">Without telling a soul.</span>
              </p>
            </div>

            <div className="space-y-3">
              {[
                "drop a link in a Reddit thread",
                "leave it in a YouTube comment",
                "pin it to Pinterest",
                "post it to a niche forum",
              ].map((p) => (
                <div key={p} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
                  <span className="text-3xl">→</span>
                  <p className="text-2xl">{p}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-coral-500 p-6 text-center ring-4 ring-coral-300">
              <p className="font-display text-4xl font-bold">strangers click for years</p>
              <p className="mt-2 text-xl text-coral-50">you get paid every time · $5/mo</p>
              <p className="mt-1 text-base text-coral-100">momfluence.app/lp/stealth-income</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="stealth-income" creativeId="c14" />
      </Block>

      {/* #15 — ChatGPT Writes It (variant-paired) */}
      <Block num={15} title={VARIANTS[4].label} hook={VARIANTS[4].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col bg-gradient-to-b from-emerald-50 to-white p-12">
            <p className="text-2xl font-bold uppercase tracking-[0.15em] text-coral-600">
              if you can copy &amp; paste, you can do this
            </p>
            <p className="mt-4 font-display text-6xl leading-tight text-navy-900">
              Let ChatGPT<br />write the post.
            </p>
            <p className="mt-3 font-display text-5xl text-coral-600">
              You keep the commission.
            </p>

            <div className="mt-8 grid grid-cols-4 items-center gap-3">
              {[
                { n: 1, l: "Pick a brand" },
                { n: 2, l: "Copy the prompt" },
                { n: 3, l: "Paste in ChatGPT" },
                { n: 4, l: "Post & earn" },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl bg-white p-4 text-center ring-2 ring-navy-100 shadow-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-coral-100 text-lg font-bold text-coral-700">{s.n}</span>
                  <p className="mt-2 text-base font-semibold text-navy-800">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-2xl bg-navy-900 p-7 text-center text-white">
              <p className="font-display text-3xl font-bold">MomFluence · $5/mo · ChatGPT does the writing</p>
              <p className="mt-1 text-base text-navy-300">momfluence.app/lp/chatgpt-writes-it</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="chatgpt-writes-it" creativeId="c15" />
      </Block>

      {/* #16 — Brands Pay for Mom Trust */}
      <Block num={16} title={VARIANTS[5].label} hook={VARIANTS[5].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="h-full w-full bg-white p-14">
            <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
              moms control 85% of household spend
            </p>

            <div className="mt-6 text-center">
              <p className="font-display text-[200px] font-bold leading-none text-navy-900">$2.4T</p>
              <p className="-mt-3 text-2xl text-navy-500">spent by moms each year</p>
            </div>

            <p className="mt-6 text-center font-display text-5xl leading-tight text-navy-900">
              Brands pay billions to reach you.
            </p>
            <p className="mt-3 text-center font-display text-5xl leading-tight text-coral-600">
              Finally — you get a cut.
            </p>

            <div className="mt-10 rounded-2xl bg-coral-500 p-7 text-center text-white">
              <p className="font-display text-3xl font-bold">20–60% recurring · $5/mo to access</p>
              <p className="mt-1 text-xl text-coral-50">momfluence.app/lp/trusted-mom-economy</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="trusted-mom-economy" creativeId="c16" />
      </Block>

      {/* #17 — Not MLM */}
      <Block num={17} title={VARIANTS[6].label} hook={VARIANTS[6].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col justify-between bg-white p-14">
            <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
              we hate MLMs too. listen up ↓
            </p>

            <div className="space-y-2">
              <p className="font-display text-6xl font-bold leading-tight text-navy-300 line-through decoration-coral-500 decoration-[8px]">
                MLM. ❌
              </p>
              <p className="font-display text-6xl font-bold leading-tight text-navy-300 line-through decoration-coral-500 decoration-[8px]">
                Course. ❌
              </p>
              <p className="font-display text-6xl font-bold leading-tight text-navy-300 line-through decoration-coral-500 decoration-[8px]">
                Crypto. ❌
              </p>
              <p className="font-display text-6xl font-bold leading-tight text-navy-300 line-through decoration-coral-500 decoration-[8px]">
                Recruit-your-friends. ❌
              </p>
              <p className="mt-4 font-display text-6xl font-bold leading-tight text-navy-900">
                Just <span className="text-coral-600">affiliate links</span>. ✓
              </p>
            </div>

            <div className="rounded-2xl bg-navy-900 p-7 text-white">
              <div className="flex items-center justify-between">
                <p className="font-display text-3xl font-bold">No tiers. No downlines. No weirdness.</p>
              </div>
              <p className="mt-2 text-xl text-navy-200">$5/mo · momfluence.app/lp/not-mlm</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="not-mlm" creativeId="c17" />
      </Block>

      {/* #18 — $25 Day One */}
      <Block num={18} title={VARIANTS[7].label} hook={VARIANTS[7].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="flex h-full w-full flex-col justify-center bg-gradient-to-br from-navy-900 to-navy-700 p-14 text-white">
            <p className="text-center text-2xl font-bold uppercase tracking-[0.2em] text-coral-300">
              the math is simple
            </p>

            <div className="mt-12 flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl uppercase tracking-widest text-navy-300">you put in</p>
                <p className="mt-2 font-display text-[200px] font-bold leading-none">$5</p>
              </div>
              <p className="font-display text-[140px] text-coral-300">→</p>
              <div className="text-center">
                <p className="text-2xl uppercase tracking-widest text-coral-300">you cash out</p>
                <p className="mt-2 font-display text-[200px] font-bold leading-none text-coral-300">$25</p>
              </div>
            </div>

            <p className="mt-10 text-center font-display text-5xl font-bold text-white">
              Day. One.
            </p>
            <p className="mt-3 text-center text-xl text-navy-200">
              Drop a few links, hit $25 in commissions, cash out same day.
            </p>

            <div className="mt-12 rounded-2xl bg-coral-500 p-6 text-center ring-4 ring-coral-300">
              <p className="font-display text-3xl font-bold">MomFluence · cancel anytime</p>
              <p className="text-base">momfluence.app/lp/twenty-five-day-one</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="twenty-five-day-one" creativeId="c18" />
      </Block>

      {/* #19 — Real Receipts */}
      <Block num={19} title={VARIANTS[8].label} hook={VARIANTS[8].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="h-full w-full bg-coral-50 p-14">
            <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
              real moms · real numbers · real Venmo
            </p>
            <p className="mt-4 font-display text-6xl leading-tight text-navy-900">
              $72.40 last week.
              <br />
              From 4 texts.
            </p>

            <div className="mt-8 rounded-3xl bg-white p-7 shadow-2xl ring-2 ring-navy-100">
              <p className="text-base uppercase tracking-widest text-navy-500">this week · Jess</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-navy-50 p-4 text-center">
                  <p className="font-display text-4xl font-bold text-navy-900">68</p>
                  <p className="text-sm text-navy-500">clicks</p>
                </div>
                <div className="rounded-xl bg-navy-50 p-4 text-center">
                  <p className="font-display text-4xl font-bold text-navy-900">12</p>
                  <p className="text-sm text-navy-500">sign-ups</p>
                </div>
                <div className="rounded-xl bg-coral-100 p-4 text-center ring-2 ring-coral-300">
                  <p className="font-display text-4xl font-bold text-coral-700">$72</p>
                  <p className="text-sm text-coral-600">earned</p>
                </div>
              </div>
              <div className="mt-4 flex h-12 items-end gap-1.5">
                {[22, 38, 28, 55, 42, 70, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-coral-400" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                <p className="text-base font-bold text-emerald-700">Friday payout</p>
                <p className="text-lg font-bold text-emerald-700">$72.40 → Venmo</p>
              </div>
            </div>

            <p className="mt-6 text-center text-2xl text-navy-700">
              $5 to start. Cancel anytime.
            </p>
            <p className="mt-1 text-center text-base text-navy-500">momfluence.app/lp/real-receipts</p>
          </div>
        </CreativeFrame>
        <VariantSpec slug="real-receipts" creativeId="c19" />
      </Block>

      {/* #20 — Faceless Creator */}
      <Block num={20} title={VARIANTS[9].label} hook={VARIANTS[9].angle}>
        <CreativeFrame w={FEED_W} h={FEED_H} scale={FEED_SCALE}>
          <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-100 via-coral-50 to-blue-100 p-14">
            <div className="absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-purple-300 opacity-30 blur-3xl" />
            <div>
              <p className="text-2xl font-bold uppercase tracking-[0.2em] text-coral-600">
                no face. no follower count. no problem.
              </p>
              <p className="mt-6 font-display text-7xl leading-tight text-navy-900">
                Start a faceless<br />content brand.
              </p>
            </div>

            <div className="relative mx-auto w-[420px]">
              <div className="rounded-[3rem] bg-navy-900 p-3 shadow-2xl">
                <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-pink-100 to-amber-50 p-8 text-center">
                  <p className="text-4xl">🎭</p>
                  <p className="mt-2 text-2xl font-bold text-navy-900">@mom_recs_anon</p>
                  <p className="text-base text-navy-500">faceless · AI-written · 47k followers</p>
                  <div className="mt-4 rounded-2xl bg-coral-500 px-5 py-3 text-white">
                    <p className="text-3xl font-bold">$1,247</p>
                    <p className="text-sm">this month, passive</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-navy-900 p-7 text-center text-white">
              <p className="font-display text-3xl font-bold">AI writes. You earn. $5/mo.</p>
              <p className="mt-1 text-base text-navy-300">momfluence.app/lp/faceless-creator</p>
            </div>
          </div>
        </CreativeFrame>
        <VariantSpec slug="faceless-creator" creativeId="c20" />
      </Block>

      <section className="mt-16 rounded-2xl bg-coral-50 p-6 ring-1 ring-coral-200">
        <h2 className="text-xl text-navy-900">Testing strategy</h2>
        <ul className="mt-3 space-y-2 text-sm text-navy-800">
          <li>→ Launch all 10 in one ad set with $30/day. Let Meta + Andromeda spend 3–5 days before judging.</li>
          <li>→ Kill creatives below 1.5% CTR after 1,000 impressions. Scale spend on creatives below $5 CPA.</li>
          <li>→ Refresh winners every 14 days — same angle, new visual — to fight creative fatigue.</li>
          <li>→ The two video scripts will likely outperform statics 2–3× on Reels placements once produced.</li>
        </ul>
      </section>
    </main>
  );
}
