import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Three steps to your first payout. Browse, share, earn. If you can text a friend a link, you can do this.",
  openGraph: {
    title: "How it works — MomFluence.app",
    description:
      "Three steps to your first payout. Browse curated brands, generate your tracked link, get paid."
  }
};

export default function HowItWorks() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* Hero */}
      <section>
        <h1 className="text-5xl text-navy-900">Three steps to your first payout.</h1>
        <p className="mt-6 text-lg text-navy-600">Browse, share, earn. That&apos;s the whole thing.</p>
        <p className="mt-4 text-lg text-navy-600">
          If you can text a friend a link, you can do this.
        </p>
        <div className="mt-10">
          <Link href="/signup" className="btn-primary no-underline">
            Get started — $5/mo
          </Link>
        </div>
      </section>

      {/* Step 1 */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Step 1: Browse curated brand offers</h2>
        <p className="mt-6 text-base text-navy-700">
          Log into your dashboard. See real brands you&apos;ve actually heard of — beauty,
          baby gear, household stuff, wellness, fashion. Each one shows you the commission
          rate before you do anything.
        </p>
        <p className="mt-4 text-base text-navy-700">
          Pick the ones you genuinely use or recommend.
        </p>
      </section>

      {/* Step 2 */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Step 2: Generate your tracked link</h2>
        <p className="mt-6 text-base text-navy-700">
          One click. You get a short, clean link tagged to your account.
        </p>
        <p className="mt-4 text-base text-navy-700">
          It works anywhere: Instagram bio, TikTok caption, group chat, Facebook post, email
          newsletter, blog post, or anything ChatGPT helps you write.
        </p>
      </section>

      {/* Step 3 */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Step 3: Share + get paid</h2>
        <p className="mt-6 text-base text-navy-700">
          Drop the link wherever you&apos;d normally recommend the product. When someone
          clicks and buys, you earn a commission.
        </p>
        <p className="mt-4 text-base text-navy-700">
          Approved conversions clear in 30 days (industry standard). Your first $25 comes
          faster — every new member gets a fast-track payout, available day one.
        </p>
      </section>

      {/* What we do behind the scenes */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">What you get for $5/month</h2>
        <p className="mt-6 text-base text-navy-700">Here&apos;s what your $5 funds:</p>
        <ul className="mt-4 space-y-3 text-base text-navy-700 list-disc list-inside">
          <li>
            Vetting affiliate programs across 50+ brands. Most affiliate programs are
            terrible. We test them so you don&apos;t waste your time.
          </li>
          <li>
            Negotiating commission rates higher than what you&apos;d get applying directly.
          </li>
          <li>
            Building tracking infrastructure (cookies, attribution windows, fraud filtering)
            so attribution actually works.
          </li>
          <li>FTC compliance templates so you don&apos;t accidentally get a notice.</li>
          <li>Real human support when something goes weird.</li>
        </ul>
      </section>

      {/* The AI angle */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">About ChatGPT</h2>
        <p className="mt-6 text-base text-navy-700">
          Yes, you can use AI to scale this. No, it&apos;s not required.
        </p>
        <p className="mt-4 text-base text-navy-700">
          Plenty of our members run multiple accounts/personas with AI-generated content.
          Plenty of others post hand-written stories about products their kids actually used
          last week.
        </p>
        <p className="mt-4 text-base text-navy-700">
          Both work. We don&apos;t care how the content gets made. We care that it converts.
        </p>
      </section>

      {/* Money flow */}
      <section className="mt-20">
        <h2 className="text-3xl text-navy-900">Where the dollars come from</h2>
        <p className="mt-6 text-base text-navy-700">Brand → MomFluence → You.</p>
        <p className="mt-4 text-base text-navy-700">
          When a customer buys through your link, the brand pays MomFluence a commission
          within 30–60 days. We pay you within 30 days of approval (faster for your first
          payout).
        </p>
        <p className="mt-4 text-base text-navy-700">
          This is how every legit affiliate platform works. We just made it less ugly and we
          don&apos;t take a cut of what you earn.
        </p>
      </section>

      {/* Final CTA */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl text-navy-900">Ready to start?</h2>
        <div className="mt-8">
          <Link href="/signup" className="btn-primary no-underline">
            Join now — $5/mo
          </Link>
        </div>
        <p className="mt-4 text-sm text-navy-500">MomFluence.app</p>
      </section>
    </main>
  );
}
