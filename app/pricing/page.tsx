import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import JoinCTA from "@/components/JoinCTA";

export const metadata: Metadata = {
  title: "Pricing — MomFluence",
  description: "$5/month membership. Cancel anytime. Includes the full curated catalog, tracked links, real-time dashboards, and NET-30 direct deposit payouts.",
  openGraph: {
    title: "Pricing — MomFluence",
    description: "$5/month. Cancel anytime.",
    url: "https://momfluence.app/pricing",
    type: "website",
  },
};

export default function Pricing() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-20">
        <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">Pricing</p>
        <h1 className="mt-3 text-4xl sm:text-5xl text-navy-900 leading-tight">
          One plan. $5 a month. Cancel anytime.
        </h1>
        <p className="mt-6 text-lg text-navy-600 max-w-2xl">
          We run one curated catalog with one membership tier. Everyone pays the same. Everyone gets the same
          access. The first conversion you make typically pays for the year.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 items-start">
          <div className="card border-2 border-coral-300 bg-white">
            <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">MomFluence Member</p>
            <p className="mt-2 text-5xl font-display font-bold text-navy-900">$5<span className="text-xl font-medium text-navy-500">/mo</span></p>
            <p className="mt-2 text-sm text-navy-600">Billed monthly. Cancel anytime from your customer portal.</p>
            <ul className="mt-6 space-y-3 text-sm text-navy-800">
              <li>✓ Full access to the curated brand catalog</li>
              <li>✓ Unlimited tracked short links</li>
              <li>✓ Real-time clicks + conversions dashboard</li>
              <li>✓ NET-30 direct deposit via Stripe</li>
              <li>✓ Automatic payouts on the 1st and 15th, $50 minimum</li>
              <li>✓ FTC-compliant disclosure templates</li>
              <li>✓ No application, no interview, no wait period</li>
              <li>✓ Cancel anytime</li>
            </ul>
            <div className="mt-8">
              <JoinCTA label="Start now — $5/mo" />
            </div>
          </div>

          <div className="card bg-navy-50 ring-navy-100">
            <p className="text-sm uppercase tracking-widest text-navy-500 font-semibold">vs. going solo</p>
            <h2 className="mt-2 text-xl text-navy-900">Joining each affiliate program one at a time</h2>
            <ul className="mt-4 space-y-3 text-sm text-navy-700">
              <li>✗ Apply to each brand individually (10–30 minutes each)</li>
              <li>✗ Wait days or weeks for approval</li>
              <li>✗ Get rejected if your following is "too small"</li>
              <li>✗ One dashboard per brand — different login, different data, different payout schedules</li>
              <li>✗ Generate UTM/affiliate URLs by hand</li>
              <li>✗ Track payouts across 10+ networks</li>
              <li>✗ Some networks pay NET-60 or NET-90</li>
              <li>✗ Some won't pay at all under $100 thresholds</li>
            </ul>
            <p className="mt-4 text-xs text-navy-500">
              MomFluence eats all of that complexity for $5/month.
            </p>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-3xl text-navy-900">Where the $5 goes</h2>
          <p className="mt-4 text-navy-600">
            Your membership funds the operational costs of running a curated catalog: vetting new brands, fighting
            for higher payout rates, building tracking infrastructure that actually works, and keeping the platform
            ad-free for members. We do not take a percentage of your earnings on top of the membership fee.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl text-navy-900">FAQ</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="font-semibold text-navy-900">Is there a free trial?</dt>
              <dd className="mt-2 text-navy-600">
                No. We keep pricing simple at $5/month. The first conversion you make typically returns the
                membership cost for the rest of the year.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">How do I cancel?</dt>
              <dd className="mt-2 text-navy-600">
                Two clicks from your Stripe customer portal — link is in your account. No phone call. No save offer.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">Do you take a cut of my payouts?</dt>
              <dd className="mt-2 text-navy-600">
                No. The $5/month is the whole platform fee. The brand pays the commission. We pass the full
                negotiated payout to you.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">What payment methods do you accept?</dt>
              <dd className="mt-2 text-navy-600">
                Visa, Mastercard, Amex, Discover, Apple Pay, and Google Pay through Stripe Checkout.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-16 text-center">
          <JoinCTA label="Join MomFluence — $5/mo" />
          <p className="mt-3 text-xs text-navy-500">
            By joining you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </section>
      </main>
    </MarketingShell>
  );
}
