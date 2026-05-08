import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — $5 per month, that's it",
  description:
    "$5/mo for 50+ vetted brand partnership programs. No upsells. No cuts. Cancel anytime.",
  openGraph: {
    title: "Pricing — $5/mo, cancel anytime",
    description:
      "Real income on real flexibility. No upsells. No cuts. No 'leadership levels.'"
  }
};

const included = [
  "Access to 50+ vetted brand partnership programs",
  "One-click tracked links",
  "Real-time earnings dashboard",
  "One fast-track payout in your first 90 days ($25 threshold)",
  "Standard payouts via PayPal, Venmo, or bank transfer",
  "FTC-compliant disclosure templates",
  "AI/ChatGPT-friendly content guidelines",
  "Cancel anytime, no commitment"
];

const compareRows: { label: string; without: string; withUs: string }[] = [
  { label: "Time to first commission", without: "4–8 weeks per program", withUs: "Same day" },
  { label: "Programs available", without: "One at a time, with rejections", withUs: "50+ pre-vetted, instant access" },
  { label: "Application process", without: "Form for each brand, weeks of waiting", withUs: "None" },
  { label: "Commission rates", without: "Whatever each program offers", withUs: "Negotiated, often higher" },
  { label: "Compliance", without: "You figure it out", withUs: "Templates included" },
  { label: "Payout", without: "Different rules everywhere", withUs: "Consistent, predictable" },
  { label: "Support", without: "None", withUs: "Real human help" }
];

export default function Pricing() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* Hero */}
      <section>
        <h1 className="text-5xl text-navy-900">$5 per month. That&apos;s it.</h1>
        <p className="mt-6 text-lg text-navy-600">
          Real income on real flexibility. Real numbers, not &lsquo;$5K from your phone!!&rsquo;
          lies.
        </p>
        <p className="mt-4 text-lg text-navy-600">
          No upsells. No kits to buy. No &lsquo;leadership levels.&rsquo;
        </p>
        <div className="mt-10">
          <Link href="/login" className="btn-primary no-underline">
            Join now — $5/month
          </Link>
        </div>
      </section>

      {/* Included */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">What you get for $5/month</h2>
        <ul className="mt-8 space-y-3">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3 text-base text-navy-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 flex-none text-coral-500"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.41 0l-3.5-3.5a1 1 0 011.41-1.42L8.5 12.09l6.79-6.8a1 1 0 011.41 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Comparison */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">What you save by using MomFluence</h2>
        <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-navy-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-50 text-navy-600 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold"></th>
                <th className="px-4 py-3 font-semibold">Without</th>
                <th className="px-4 py-3 font-semibold">With MomFluence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {compareRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-4 py-3 font-semibold text-navy-800 align-top">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-navy-600 align-top">{row.without}</td>
                  <td className="px-4 py-3 text-navy-700 align-top">{row.withUs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Earnings expectations */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Real talk on what you can earn</h2>
        <p className="mt-6 text-base text-navy-700">
          Earnings vary based on your audience, engagement, and what you share. Here&apos;s
          the realistic spread from our member data:
        </p>
        <div className="mt-6 space-y-4 text-base text-navy-700">
          <p>
            <span className="font-semibold text-navy-900">Just starting out:</span> $5–$50/mo.
            Some months zero. Totally fine — you&apos;re figuring out what converts.
          </p>
          <p>
            <span className="font-semibold text-navy-900">Engaged network (1K–10K reach):</span>{" "}
            $50–$500/mo for active members.
          </p>
          <p>
            <span className="font-semibold text-navy-900">Bigger reach (10K+):</span>{" "}
            $500–$5,000+/mo. Niche communities sometimes outperform broader audiences.
          </p>
          <p>
            <span className="font-semibold text-navy-900">
              Power users with multiple personas/AI systems:
            </span>{" "}
            Scales with effort. Some members run several accounts.
          </p>
        </div>
        <p className="mt-6 text-base text-navy-700">
          If you&apos;re not earning back your $5/mo, cancel in two clicks. We&apos;d rather
          you go than feel ripped off.
        </p>
      </section>

      {/* Why $5 */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Why we charge anything</h2>
        <p className="mt-6 text-base text-navy-700">
          We could make this free and take a cut of your earnings. We chose not to.
          Here&apos;s why:
        </p>
        <ol className="mt-6 space-y-4 text-base text-navy-700 list-decimal list-inside">
          <li>
            <span className="font-semibold text-navy-900">It funds curation.</span> Vetting
            brand programs is real work. Someone has to test the bad ones so you don&apos;t
            waste time.
          </li>
          <li>
            <span className="font-semibold text-navy-900">It filters serious creators.</span>{" "}
            Free platforms get flooded with bots and spammers. $5 keeps the bar high enough
            to keep the platform clean.
          </li>
          <li>
            <span className="font-semibold text-navy-900">We don&apos;t take a cut.</span> You
            keep 100% of brand commissions. We make money when you stay because we deliver
            value, not because we skim.
          </li>
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-20 scroll-mt-24">
        <h2 className="text-3xl text-navy-900">Common questions</h2>
        <div className="mt-8 space-y-8">
          <div>
            <p className="text-lg font-semibold text-navy-900">Is there a contract?</p>
            <p className="mt-2 text-base text-navy-700">No. Month-to-month, cancel anytime.</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">Do you take a cut of my earnings?</p>
            <p className="mt-2 text-base text-navy-700">
              No. The $5/mo is everything. You keep 100% of brand commissions.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">What if I make $0?</p>
            <p className="mt-2 text-base text-navy-700">
              Cancel in two clicks. No retention calls. No guilt.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">Can I try it for free first?</p>
            <p className="mt-2 text-base text-navy-700">
              Not currently. The $5/mo is by design — it filters serious creators. But you
              can cancel within minutes if it&apos;s not for you.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">Refund policy?</p>
            <p className="mt-2 text-base text-navy-700">
              We don&apos;t pro-rate partial months (industry standard), but if something
              feels off, email hello@momfluence.app and we&apos;ll figure it out like humans.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl text-navy-900">$5. Cancel anytime.</h2>
        <div className="mt-8">
          <Link href="/login" className="btn-primary no-underline">
            Join MomFluence
          </Link>
        </div>
        <p className="mt-4 text-sm text-navy-500">MomFluence.app</p>
      </section>
    </main>
  );
}
