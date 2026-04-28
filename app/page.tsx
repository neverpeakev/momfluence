import Link from "next/link";

export default function PublicLanding() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">MomFluence Creator Hub</p>
      <h1 className="mt-3 text-5xl text-navy-900">Find local offers. Share your link. Get paid.</h1>
      <p className="mt-6 text-lg text-navy-600">
        Welcome back to the MomFluence creator dashboard. Sign in to browse this week's offers in your area,
        generate your tracking link, and check your earnings.
      </p>
      <div className="mt-10 flex gap-4">
        <Link href="/login" className="btn-primary">Sign in</Link>
        <a href="https://momfluence.app/for-influencers" className="btn-ghost">New here? Apply →</a>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="card">
          <h3 className="text-lg">Browse offers</h3>
          <p className="mt-2 text-sm text-navy-600">Local brands in your category, pre-vetted by us. Each listing shows what you'll earn per conversion — no math.</p>
        </div>
        <div className="card">
          <h3 className="text-lg">Get your link</h3>
          <p className="mt-2 text-sm text-navy-600">One click and you have a tracked short link tagged to your account. Drop it in your bio or caption.</p>
        </div>
        <div className="card">
          <h3 className="text-lg">Get paid NET-30</h3>
          <p className="mt-2 text-sm text-navy-600">Approved conversions clear in 30 days. PayPal, Venmo, ACH. $50 minimum.</p>
        </div>
      </div>
    </main>
  );
}
