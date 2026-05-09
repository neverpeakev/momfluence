import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Moms: have $5 + friends?",
  description:
    "If you've ever told another mom which stroller to buy, you've already done affiliate marketing. MomFluence pays you for it. $5/mo.",
  openGraph: {
    title: "For Moms: have $5 + friends? — MomFluence.app",
    description:
      "Get paid for the stuff you're already sharing. Real brands, real commissions."
  }
};

export default function ForInfluencers() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* Hero */}
      <section>
        <h1 className="text-5xl text-navy-900">Moms: have $5 and friends?</h1>
        <p className="mt-6 text-lg text-navy-600">
          (Or ChatGPT — we&apos;re not picky.)
        </p>
        <p className="mt-4 text-lg text-navy-600">
          Get paid for the stuff you&apos;re already sharing. Real brands, real commissions,
          paid right to your phone.
        </p>
        <div className="mt-10">
          <Link href="/signup" className="btn-primary no-underline">
            Join MomFluence — $5/mo
          </Link>
        </div>
      </section>

      {/* The reality */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Here&apos;s the actual deal</h2>
        <p className="mt-6 text-base text-navy-700">
          If you&apos;ve ever told another mom which stroller to buy, which mascara is worth
          it, which laundry detergent finally got the smell out — you&apos;ve already done
          affiliate marketing. You just didn&apos;t get paid for it.
        </p>
        <p className="mt-4 text-base text-navy-700">
          MomFluence is the platform that pays you for it. Same recommendations. Same
          friends. Different bank balance.
        </p>
      </section>

      {/* How it actually works */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Three things you&apos;ll do</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="card">
            <h3 className="text-lg">Browse brands you already use</h3>
            <p className="mt-3 text-sm text-navy-600">
              Sephora, Walmart, Target, Sephora — wait, did we say Sephora twice? It&apos;s
              that good. We&apos;ve vetted 50+ brand partnership programs so you don&apos;t
              have to.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg">Generate your tracked link</h3>
            <p className="mt-3 text-sm text-navy-600">
              One click. You get a clean link tagged to your account. Drop it in a group
              chat, an Instagram story, a TikTok caption, or wherever you talk about
              products.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg">Get paid when people buy</h3>
            <p className="mt-3 text-sm text-navy-600">
              When someone clicks your link and buys, you earn a commission. Your first $25
              can land in your PayPal as soon as day one. After that, $50 minimum, max 2
              cashouts per month.
            </p>
          </div>
        </div>
      </section>

      {/* The ChatGPT thing */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Yes, AI is welcome here</h2>
        <p className="mt-6 text-base text-navy-700">
          We don&apos;t care HOW you create content. We care that it converts.
        </p>
        <p className="mt-4 text-base text-navy-700">
          Some of our members write every caption by hand. Some run their entire account
          through ChatGPT — generated personas, AI-written posts, the whole stack. Most are
          somewhere in between.
        </p>
        <p className="mt-4 text-base text-navy-700">
          Your $5/mo gets you the same platform either way. Use whatever tools you want.
        </p>
      </section>

      {/* Real talk on earnings */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">What you can actually earn</h2>
        <p className="mt-6 text-base text-navy-700">
          We&apos;re going to be straight with you because you&apos;ve heard enough lies.
        </p>
        <p className="mt-4 text-base text-navy-700">A few honest ranges from our member data:</p>
        <ul className="mt-4 space-y-2 text-base text-navy-700 list-disc list-inside">
          <li>
            New to this, audience under 500: $0–$50/mo. Some months zero. Totally fine —
            you&apos;re learning.
          </li>
          <li>Engaged audience of 1,000–10,000: $50–$500/mo for active members.</li>
          <li>Bigger reach (10,000+): $500–$5,000+/mo.</li>
          <li>Power users running multiple accounts/personas: scales with effort.</li>
        </ul>
        <p className="mt-4 text-base text-navy-700">
          We don&apos;t promise specific income. Anyone who does is selling you something.
        </p>
      </section>

      {/* Why $5 */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Why we charge anything</h2>
        <p className="mt-6 text-base text-navy-700">Three reasons:</p>
        <ol className="mt-4 space-y-3 text-base text-navy-700 list-decimal list-inside">
          <li>It funds the curation work. Vetting brand programs is real work. Someone has to test the bad ones.</li>
          <li>
            It filters the spammers. Free platforms attract bots. $5 keeps the bar high
            enough to keep the platform clean.
          </li>
          <li>
            We don&apos;t take a cut of your earnings. You keep 100% of what brands pay. The
            $5 is the whole deal.
          </li>
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-20 scroll-mt-24">
        <h2 className="text-3xl text-navy-900">Questions you&apos;re probably asking</h2>
        <div className="mt-8 space-y-8">
          <div>
            <p className="text-lg font-semibold text-navy-900">Do I need a big following?</p>
            <p className="mt-2 text-base text-navy-700">
              No. If you have 50 friends in a group chat or 500 followers on Instagram, you
              can earn here. We&apos;ve got members who started with under 200 followers.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">What about the IRS / taxes?</p>
            <p className="mt-2 text-base text-navy-700">
              Standard 1099 stuff. You&apos;ll get a W-9 prompt once you hit $600 in
              cumulative earnings. We&apos;ll send you a 1099-NEC in January for any tax
              year you crossed that threshold.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">Can I really use ChatGPT for this?</p>
            <p className="mt-2 text-base text-navy-700">
              Yes. Plenty of members do. Generated personas, AI-written captions, AI-curated
              product roundups — all fine. We just ask that you follow FTC disclosure rules
              (we provide templates).
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">How fast do I actually get paid?</p>
            <p className="mt-2 text-base text-navy-700">
              Your fast-track first $25 unlocks day one — no 90-day wait. After
              that: $50 minimum, max 2 payouts per month, paid within 30 days of approval.
              We pay via PayPal, Venmo, or bank transfer.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">What if I make nothing?</p>
            <p className="mt-2 text-base text-navy-700">
              Cancel in two clicks. No questions asked. We don&apos;t have retention
              specialists. We don&apos;t care if you stay; we care that the people who DO
              stay are getting real value.
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-navy-900">Who&apos;s behind this?</p>
            <p className="mt-2 text-base text-navy-700">
              MomFluence is built by Never Peak Inc., a marketing technology company in El
              Segundo, California. We&apos;ve spent years running performance marketing for
              brands. We built this for the moms we know who deserve a better way to
              monetize their networks.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl text-navy-900">
          Ready to get paid for what you&apos;re already doing?
        </h2>
        <div className="mt-8">
          <Link href="/signup" className="btn-primary no-underline">
            Join MomFluence — $5/mo
          </Link>
        </div>
        <p className="mt-4 text-sm text-navy-500">
          Cancel anytime. No upsells. Find us at MomFluence.app.
        </p>
      </section>
    </main>
  );
}
