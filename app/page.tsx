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
            Your fast-track first $25 unlocks day one. After that: $50 minimum,
            max 2 cashouts per month. PayPal, Venmo, or bank transfer.
          </p>
        </div>
      </div>

      <section className="mt-24">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Frequently asked
        </p>
        <h2 className="mt-2 text-4xl text-navy-900">
          Questions every mom asks. Answered fast.
        </h2>
        <p className="mt-3 text-base text-navy-600">
          Tap any question to expand.
        </p>

        <div className="mt-8 space-y-3">
          <details
            name="momfluence-faq"
            className="faq-item rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-navy-200 open:ring-coral-200 sm:p-6"
          >
            <summary className="faq-summary flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-navy-900 sm:text-lg">
                Wait — isn&apos;t this just a refer-a-friend link?
              </span>
              <span
                aria-hidden="true"
                className="faq-chevron flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-bold text-navy-700"
              >
                ▾
              </span>
            </summary>
            <div className="faq-body space-y-3 pt-4 text-base text-navy-700">
              <p>
                <span className="font-semibold text-navy-900">No.</span>{" "}
                Refer-a-friend programs pay you a tiny one-time bonus —
                think: $10 once, never again.
              </p>
              <p>
                MomFluence links plug into{" "}
                <span className="font-semibold text-navy-900">
                  real brand partnership programs
                </span>{" "}
                that pay you{" "}
                <span className="font-semibold text-navy-900">
                  20–60% of every monthly subscription
                </span>{" "}
                your friend pays — for as long as she stays a customer.
              </p>
              <p>
                Some programs pay for 12 months. Some pay for life. That&apos;s
                recurring revenue, not a one-time tip.
              </p>
            </div>
          </details>

          <details
            name="momfluence-faq"
            className="faq-item rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-navy-200 open:ring-coral-200 sm:p-6"
          >
            <summary className="faq-summary flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-navy-900 sm:text-lg">
                How is this different from just signing up to be an affiliate myself?
              </span>
              <span
                aria-hidden="true"
                className="faq-chevron flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-bold text-navy-700"
              >
                ▾
              </span>
            </summary>
            <div className="faq-body space-y-3 pt-4 text-base text-navy-700">
              <p>
                Most real brand programs require a written application, sample
                content, an interview, days of waiting, and a 50/50 shot at
                &ldquo;thanks but no.&rdquo;
              </p>
              <p>
                We&apos;ve already gone through that on your behalf and gotten
                approved at scale —{" "}
                <span className="font-semibold text-navy-900">
                  often at rates higher than you&apos;d get solo.
                </span>
              </p>
              <p>You get the link in one click instead of two weeks of waiting.</p>
            </div>
          </details>

          <details
            name="momfluence-faq"
            className="faq-item rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-navy-200 open:ring-coral-200 sm:p-6"
          >
            <summary className="faq-summary flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-navy-900 sm:text-lg">
                Do I have to push these links to my mom friends?
              </span>
              <span
                aria-hidden="true"
                className="faq-chevron flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-bold text-navy-700"
              >
                ▾
              </span>
            </summary>
            <div className="faq-body space-y-3 pt-4 text-base text-navy-700">
              <p>
                Nope.{" "}
                <span className="font-semibold text-navy-900">
                  You can run this completely anonymously.
                </span>
              </p>
              <p>A few places people drop links:</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                <li className="flex gap-2"><span className="text-coral-500">→</span> A faceless TikTok or IG account</li>
                <li className="flex gap-2"><span className="text-coral-500">→</span> Comments under YouTube videos</li>
                <li className="flex gap-2"><span className="text-coral-500">→</span> Subreddits, Quora threads</li>
                <li className="flex gap-2"><span className="text-coral-500">→</span> Niche Facebook groups</li>
                <li className="flex gap-2"><span className="text-coral-500">→</span> A blog post you write once</li>
                <li className="flex gap-2"><span className="text-coral-500">→</span> Pinterest pins, Discord, forums</li>
              </ul>
              <p>The link is the link. Where you put it is up to you.</p>
            </div>
          </details>

          <details
            name="momfluence-faq"
            className="faq-item rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-navy-200 open:ring-coral-200 sm:p-6"
          >
            <summary className="faq-summary flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-navy-900 sm:text-lg">
                I&apos;m not a writer or creator. Can I still do this?
              </span>
              <span
                aria-hidden="true"
                className="faq-chevron flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-bold text-navy-700"
              >
                ▾
              </span>
            </summary>
            <div className="faq-body space-y-3 pt-4 text-base text-navy-700">
              <p>Yes. Here&apos;s the easy way:</p>
              <ol className="space-y-2">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">1</span>
                  <span>Pick a brand from your dashboard.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">2</span>
                  <span>Copy the prompt we give you.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">3</span>
                  <span>Paste it into ChatGPT (or Claude, or Gemini).</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">4</span>
                  <span>Get back 5 TikTok hooks, a Reddit post, or a blog draft in about 6 seconds.</span>
                </li>
              </ol>
              <p>
                New to AI? Email{" "}
                <a
                  href="mailto:hello@momfluence.app"
                  className="font-semibold text-coral-600 hover:text-coral-700"
                >
                  hello@momfluence.app
                </a>{" "}
                and we&apos;ll walk you through it. It&apos;s the easiest part of
                this whole thing.
              </p>
            </div>
          </details>

          <details
            name="momfluence-faq"
            className="faq-item rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-navy-200 open:ring-coral-200 sm:p-6"
          >
            <summary className="faq-summary flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-navy-900 sm:text-lg">
                How fast can I actually get paid?
              </span>
              <span
                aria-hidden="true"
                className="faq-chevron flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-bold text-navy-700"
              >
                ▾
              </span>
            </summary>
            <div className="faq-body space-y-3 pt-4 text-base text-navy-700">
              <p>
                Your fast-track first $25 is available{" "}
                <span className="font-semibold text-navy-900">day one.</span>{" "}
                Drop your link, drive a few sign-ups or sales, hit $25 → cash out.
              </p>
              <p>
                After that: $50 minimum per cashout, max 2 cashouts per month.
                PayPal, Venmo, or bank transfer.
              </p>
            </div>
          </details>

          <details
            name="momfluence-faq"
            className="faq-item rounded-2xl bg-white p-5 ring-1 ring-navy-100 hover:ring-navy-200 open:ring-coral-200 sm:p-6"
          >
            <summary className="faq-summary flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-navy-900 sm:text-lg">
                What happens if I cancel my $5/mo membership?
              </span>
              <span
                aria-hidden="true"
                className="faq-chevron flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-bold text-navy-700"
              >
                ▾
              </span>
            </summary>
            <div className="faq-body space-y-3 pt-4 text-base text-navy-700">
              <p>
                Earnings on your tracked links{" "}
                <span className="font-semibold text-navy-900">pause</span>{" "}
                until you reactivate.
              </p>
              <p>
                Anything you&apos;ve already earned stays in your account, but
                new commissions don&apos;t accrue while inactive. Cancel anytime,
                reactivate anytime.
              </p>
            </div>
          </details>
        </div>

        <p className="mt-8 text-center text-sm text-navy-500">
          Still have a question?{" "}
          <a
            href="mailto:hello@momfluence.app"
            className="font-semibold text-coral-600 hover:text-coral-700"
          >
            hello@momfluence.app
          </a>{" "}
          — we usually reply same day.
        </p>
      </section>

      <section className="mt-24 rounded-3xl bg-navy-900 p-10 text-center sm:p-14">
        <h2 className="text-4xl text-white">$5/month. Cancel anytime.</h2>
        <p className="mt-4 text-base text-navy-200">
          Your fast-track first $25 unlocks day one.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/signup" className="btn-primary no-underline">
            Join MomFluence — $5/mo
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-navy-700 bg-transparent px-5 py-3 font-medium text-navy-100 transition hover:bg-navy-800 no-underline"
          >
            How it works →
          </Link>
        </div>
      </section>
    </main>
  );
}
