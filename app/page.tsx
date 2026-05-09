import Link from "next/link";
import BrandRibbon from "@/components/landing/BrandRibbon";
import TextDemo from "@/components/landing/TextDemo";
import DashboardPreview from "@/components/landing/DashboardPreview";

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
        <Link href="/signup" className="btn-primary no-underline">
          Join $5/mo
        </Link>
        <Link href="/how-it-works" className="btn-ghost no-underline">
          How it works →
        </Link>
      </div>

      <BrandRibbon />

      <section className="mt-20">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          How it actually plays out
        </p>
        <h2 className="mt-2 text-3xl text-navy-900">
          One text → tracked link → real money in your dashboard.
        </h2>
        <p className="mt-4 text-base text-navy-600">
          You already recommend stuff to your group chat. We just make sure you get
          paid when a friend signs up or buys.
        </p>

        <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
          <div className="flex justify-center">
            <TextDemo />
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">
                1
              </span>
              <p className="text-base text-navy-700">
                Send a friend your tracked MomFluence link the way you&apos;d normally text a rec.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">
                2
              </span>
              <p className="text-base text-navy-700">
                She taps it, signs up or buys, and the brand attributes the conversion to you.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">
                3
              </span>
              <p className="text-base text-navy-700">
                Your dashboard updates in real time. Cash out to Venmo, PayPal, or bank.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="text-2xl text-navy-900">Then your dashboard does the bragging.</h3>
            <p className="mt-3 text-base text-navy-600">
              The second you&apos;re in (it&apos;s $5/month), you see exactly what&apos;s
              happening: clicks, sign-ups, and dollars earned this week. No guessing,
              no chasing brands, no spreadsheets.
            </p>
            <p className="mt-3 text-sm text-navy-500">
              Numbers below are an example week from a typical first-month member.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <div className="mt-20 grid gap-6 sm:grid-cols-3">
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
