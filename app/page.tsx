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

      <section className="mt-24">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          What you actually get
        </p>
        <h2 className="mt-2 text-4xl text-navy-900">
          These aren&apos;t refer-a-friend links.
        </h2>
        <p className="mt-3 text-base text-navy-600">
          Biggest difference between MomFluence and every other &ldquo;share a
          link&rdquo; thing on the internet.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-navy-100 p-6 ring-1 ring-navy-200">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-navy-500">
              Typical refer-a-friend
            </p>
            <p className="mt-3 text-3xl font-display font-bold text-navy-700">
              $5. Once.
            </p>
            <p className="mt-1 text-sm text-navy-600">Then it&apos;s over forever.</p>
            <ul className="mt-4 space-y-1.5 text-sm text-navy-600">
              <li>✗ One-time, tiny payout</li>
              <li>✗ Same offer every app uses</li>
              <li>✗ Dies the second they cancel</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-coral-500 p-6 text-white shadow-lg ring-1 ring-coral-400">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-coral-100">
              MomFluence partnership link
            </p>
            <p className="mt-3 text-3xl font-display font-bold">
              20–60%. Every month.
            </p>
            <p className="mt-1 text-sm text-coral-50">
              Recurring. Sometimes for life.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-coral-50">
              <li>✓ % of every monthly subscription she pays</li>
              <li>✓ Exclusive — application + interview, already done</li>
              <li>✓ Keeps paying as long as she stays</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="text-2xl">🔑</p>
            <h3 className="mt-2 text-base">Exclusive access</h3>
            <p className="mt-1 text-sm text-navy-600">
              Programs that usually need an app, sample content, and an interview.
              We did all that.
            </p>
          </div>
          <div className="card">
            <p className="text-2xl">🔁</p>
            <h3 className="mt-2 text-base">Recurring forever</h3>
            <p className="mt-1 text-sm text-navy-600">
              One signup → paid every month she stays. Some pay 12 months. Some
              pay for life.
            </p>
          </div>
          <div className="card">
            <p className="text-2xl">💸</p>
            <h3 className="mt-2 text-base">Real percentages</h3>
            <p className="mt-1 text-sm text-navy-600">
              20–60% of the subscription. Not Amazon-affiliate scraps.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-base text-navy-700">
          <span className="font-semibold text-navy-900">Translation:</span> passive
          income from the stuff you already recommend online.
        </p>
      </section>

      <section className="mt-24">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Pro tip
        </p>
        <h2 className="mt-2 text-4xl text-navy-900">
          Don&apos;t feel like writing the post? Don&apos;t.
        </h2>
        <p className="mt-3 text-base text-navy-600">
          Just ask ChatGPT (or Claude, or Gemini) to do it for you. Takes 6 seconds.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-sm font-bold text-coral-700">
              1
            </span>
            <p className="mt-3 text-base text-navy-800">
              Pick a brand from your dashboard.
            </p>
          </div>
          <div className="card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-sm font-bold text-coral-700">
              2
            </span>
            <p className="mt-3 text-base text-navy-800">
              Copy the prompt we give you.
            </p>
          </div>
          <div className="card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-sm font-bold text-coral-700">
              3
            </span>
            <p className="mt-3 text-base text-navy-800">Paste it into ChatGPT.</p>
          </div>
          <div className="card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-sm font-bold text-coral-700">
              4
            </span>
            <p className="mt-3 text-base text-navy-800">
              Done. 5 TikTok hooks, a Reddit post, or a blog draft — ready to share.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-navy-50 p-4 ring-1 ring-navy-100">
          <p className="text-sm text-navy-700">
            <span className="font-semibold text-navy-900">New to AI?</span> No
            problem.{" "}
            <a
              href="mailto:hello@momfluence.app"
              className="font-semibold text-coral-600 hover:text-coral-700"
            >
              Just ask our support team
            </a>
            {" "}— we&apos;ll walk you through it. (It&apos;s the easiest part of
            this whole thing.)
          </p>
        </div>
      </section>

      <section className="mt-24 rounded-3xl bg-navy-900 p-10 text-center sm:p-14">
        <p className="text-xs uppercase tracking-widest text-coral-300 font-semibold">
          That&apos;s the whole pitch
        </p>
        <h2 className="mt-3 text-4xl text-white">
          $5 to start. Cancel anytime. The first $25 can land in 90 days.
        </h2>
        <p className="mt-4 text-base text-navy-200">
          Worst case: you spend $5, drop a few links, get nothing, cancel. You&apos;re
          out a coffee.
          <br />
          Best case: you build a tiny little income engine that pays you for years.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/signup" className="btn-primary no-underline">
            Join MomFluence — $5/mo
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-navy-700 bg-transparent px-5 py-3 font-medium text-navy-100 transition hover:bg-navy-800 no-underline"
          >
            Read the long version →
          </Link>
        </div>
      </section>
    </main>
  );
}
