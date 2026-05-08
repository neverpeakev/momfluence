import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import JoinCTA from "@/components/JoinCTA";

export const metadata: Metadata = {
  title: "How it works — MomFluence",
  description: "Three steps: browse curated offers, get your tracked link, get paid NET-30 by direct deposit.",
  openGraph: {
    title: "How it works — MomFluence",
    description: "Browse → share → earn.",
    url: "https://momfluence.app/how-it-works",
    type: "website",
  },
};

export default function HowItWorks() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-3xl px-6 pt-16 pb-20">
        <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">How it works</p>
        <h1 className="mt-3 text-4xl sm:text-5xl text-navy-900 leading-tight">
          Three steps. Then you get paid.
        </h1>
        <p className="mt-6 text-lg text-navy-600">
          MomFluence cuts every step that makes affiliate programs frustrating: applications, wait lists,
          tracking parameters, dashboards that don't talk to each other, payouts that ghost.
        </p>

        <ol className="mt-12 space-y-6">
          <li className="card">
            <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">Step 1</p>
            <h2 className="mt-1 text-2xl text-navy-900">Browse the curated catalog</h2>
            <p className="mt-3 text-navy-600">
              Every brand has been hand-picked for Mom audiences and pre-vetted for payout reliability. Each listing
              shows exactly what you'll earn per conversion — no math, no hunting through brand portals. Filter by
              category, payout amount, or product type.
            </p>
          </li>
          <li className="card">
            <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">Step 2</p>
            <h2 className="mt-1 text-2xl text-navy-900">Click "Get my link"</h2>
            <p className="mt-3 text-navy-600">
              One click and you have a tracked short link tagged to your account. Drop it into a caption, a DM,
              your Linktree, your group chat — anywhere. We track every click and conversion back to you, even if
              your friend forwards the link to someone else.
            </p>
          </li>
          <li className="card">
            <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">Step 3</p>
            <h2 className="mt-1 text-2xl text-navy-900">Get paid, automatically</h2>
            <p className="mt-3 text-navy-600">
              Approved conversions clear NET-30. Direct deposit via Stripe to your bank or debit card on the 1st
              and 15th of every month. $50 minimum payout. No invoicing. No follow-up emails. Money just shows up.
            </p>
          </li>
        </ol>

        <section className="mt-16">
          <h2 className="text-3xl text-navy-900">What's tracked, exactly</h2>
          <ul className="mt-4 list-disc pl-6 space-y-2 text-navy-600">
            <li>Every click on your unique short link, with timestamp and source</li>
            <li>Every conversion (purchase, signup, lead — depends on the offer)</li>
            <li>Earnings per offer and overall, in real time</li>
            <li>Payout status — pending, approved, scheduled, paid</li>
            <li>Reversals (returns/fraud) with reason and date, so there are no surprises</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl text-navy-900">What it costs you</h2>
          <p className="mt-4 text-navy-600">
            $5/month. That's the whole price. No revenue share on top. No hidden fees. The first conversion you
            make typically pays for the membership for the rest of the year.
          </p>
        </section>

        <section className="mt-16 card bg-coral-50 ring-coral-100 text-center">
          <h2 className="text-3xl text-navy-900">Try it for $5.</h2>
          <p className="mt-3 text-navy-600">Cancel anytime. No application or wait period.</p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <JoinCTA label="Join MomFluence" />
            <Link href="/for-influencers" className="btn-ghost no-underline">Read the full pitch</Link>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
