import Link from "next/link";

export default function PublicLanding() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">
        MomFluence.app
      </p>
      <h1 className="mt-3 text-5xl text-navy-900">
        Moms: have $5 + friends (or ChatGPT)?
      </h1>
      <p className="mt-6 text-lg text-navy-600">
        Get paid for the stuff you&apos;re already sharing.
        <br />
        Real brands. Real commissions. Right to your phone.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/pricing" className="btn-primary no-underline">
          Join $5/mo
        </Link>
        <Link href="/how-it-works" className="btn-ghost no-underline">
          How it works →
        </Link>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="card">
          <h3 className="text-lg">Browse curated brands</h3>
          <p className="mt-2 text-sm text-navy-600">
            Real brands you already know. Sephora, Target, Walmart, the works. We&apos;ve
            vetted 50+ partnership programs so you don&apos;t waste time on duds.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg">Generate your link</h3>
          <p className="mt-2 text-sm text-navy-600">
            One click. You get a tracked link that works in any post, story, bio, or group
            chat. ChatGPT can help you scale if that&apos;s your move.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg">Get paid fast</h3>
          <p className="mt-2 text-sm text-navy-600">
            Your first payout can land within your first 90 days for as little as $25. After
            that: $50 minimum, max 2 cashouts per month. PayPal, Venmo, or bank transfer.
          </p>
        </div>
      </div>
    </main>
  );
}
