import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import JoinCTA from "@/components/JoinCTA";

type SearchParams = Promise<{ cancelled?: string }>;

export default async function PublicLanding({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const showCancelled = params.cancelled === "true";

  return (
    <MarketingShell>
      <main className="mx-auto max-w-5xl px-6 pt-16 pb-20">
        {showCancelled && (
          <div className="mb-8 card border-l-4 border-coral-400 bg-coral-50">
            <p className="text-sm text-navy-800">
              No worries — your checkout was cancelled. You weren&rsquo;t charged. Ready when you are.
            </p>
          </div>
        )}
        <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">MomFluence Creator Hub</p>
        <h1 className="mt-3 text-4xl sm:text-5xl text-navy-900 leading-tight">
          Curated brand partnerships for Moms. Share your link. Get paid.
        </h1>
        <p className="mt-6 text-lg text-navy-600 max-w-2xl">
          Hand-picked, pre-vetted brands. No applications. No interviews. No wait periods. Drop your link in a caption and earn for every conversion.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 items-center">
          <JoinCTA label="Join for $5/mo" />
          <Link href="/how-it-works" className="btn-ghost no-underline">How it works</Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="card">
            <h3 className="text-lg">Browse offers</h3>
            <p className="mt-2 text-sm text-navy-600">
              Hand-picked, top-paying brands, pre-vetted by us. Each listing shows what you&rsquo;ll earn per conversion &mdash; no math.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg">Get your link</h3>
            <p className="mt-2 text-sm text-navy-600">
              One click and you have a tracked short link tagged to your account. Drop it in your bio or caption.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg">Get paid NET-30</h3>
            <p className="mt-2 text-sm text-navy-600">
              Approved conversions clear in 30 days. Direct deposit via Stripe. $50 minimum payout.
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-2 items-start">
          <div>
            <h2 className="text-3xl text-navy-900">Built for Moms with friends.</h2>
            <p className="mt-4 text-navy-600">
              You already recommend the products you love. MomFluence pays you a real cut for it. No DM negotiations.
              No content quotas. No affiliate-program red tape.
            </p>
            <p className="mt-4 text-navy-600">
              We do the legwork: sourcing offers, vetting brands, negotiating payouts, and tracking every click and
              conversion back to you. You share. We track. You get paid.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <JoinCTA label="Get started — $5/mo" />
              <Link href="/for-influencers" className="btn-ghost no-underline">Read the full pitch</Link>
            </div>
          </div>
          <div className="card bg-coral-50 ring-coral-100">
            <p className="text-sm uppercase tracking-widest text-coral-700 font-semibold">What you get for $5/mo</p>
            <ul className="mt-4 space-y-3 text-navy-800 text-sm">
              <li>• Access to every offer in the curated catalog</li>
              <li>• A unique tracked short link for every brand you want to share</li>
              <li>• Real-time click + conversion dashboards</li>
              <li>• NET-30 direct deposit payouts via Stripe</li>
              <li>• No application, no interview, no wait list</li>
              <li>• Cancel anytime from your customer portal</li>
            </ul>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
