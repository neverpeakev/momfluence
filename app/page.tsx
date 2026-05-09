import Link from "next/link";
import BrandRibbon from "@/components/landing/BrandRibbon";
import TextDemo from "@/components/landing/TextDemo";
import DashboardPreview from "@/components/landing/DashboardPreview";
import AIStudioPreview from "@/components/landing/AIStudioPreview";

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
          Why this is different
        </p>
        <h2 className="mt-2 text-4xl text-navy-900">
          Two things every mom asks before she signs up. Let&apos;s clear them up.
        </h2>

        <div className="mt-10 space-y-8">
          <div className="card">
            <blockquote className="border-l-4 border-coral-300 pl-4">
              <p className="text-2xl italic text-navy-900 font-display">
                &ldquo;Wait, isn&apos;t this just one of those refer-a-friend
                links every app pushes?&rdquo;
              </p>
            </blockquote>

            <p className="mt-6 text-base text-navy-700">Nope. And this is where most people get it wrong.</p>

            <p className="mt-4 text-base text-navy-700">
              Those &ldquo;refer a friend, get $10&rdquo; links?{" "}
              <span className="font-semibold text-navy-900">They pay you once.</span> $5.
              Maybe $20 if it&apos;s fancy. Then it&apos;s over forever. That&apos;s not
              what we do.
            </p>

            <p className="mt-4 text-base text-navy-700">
              Our links plug into <span className="font-semibold text-navy-900">real brand partnership programs</span>{" "}
              — the kind that normally require a written application, sample content,
              an interview, a few days of waiting, and a 50/50 shot at &ldquo;thanks but
              no.&rdquo; We&apos;ve already gone through all that on your behalf, gotten
              approved at scale, and negotiated rates higher than what you&apos;d get
              applying solo. You get the link in one click.
            </p>

            <p className="mt-4 text-base text-navy-700">
              And here&apos;s the part nobody tells you about real affiliate programs:{" "}
              <span className="font-semibold text-navy-900">most of them pay recurring.</span>{" "}
              20–50% of your friend&apos;s monthly subscription. Every month she stays a
              customer. Some programs pay for 12 months. Some pay for the entire
              lifetime of the customer.
            </p>

            <p className="mt-4 text-base text-navy-700">
              Translation: one share → income that keeps showing up while you sleep,
              eat lunch, do school pickup. Month after month after month. That&apos;s
              the difference between a $5 referral bonus and actual passive income.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-navy-50 p-4 ring-1 ring-navy-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">
                  Typical refer-a-friend
                </p>
                <p className="mt-1 text-base text-navy-700">
                  $5 once. Done. They forget. So do you.
                </p>
              </div>
              <div className="rounded-xl bg-coral-50 p-4 ring-1 ring-coral-200">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-coral-700">
                  MomFluence partnership link
                </p>
                <p className="mt-1 text-base text-navy-800">
                  20–50% of her sub, every month, sometimes for life. One share → years
                  of payouts.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <blockquote className="border-l-4 border-coral-300 pl-4">
              <p className="text-2xl italic text-navy-900 font-display">
                &ldquo;Cool, but I&apos;m not spamming my mom group chat. That&apos;s
                not me.&rdquo;
              </p>
            </blockquote>

            <p className="mt-6 text-base text-navy-700">Totally fine. Don&apos;t.</p>

            <p className="mt-4 text-base text-navy-700">
              (Though — real talk — we think you&apos;re sitting on the most
              undervalued asset in your phone. You already tell your friends which
              stroller to buy. You already DM the mascara that finally worked. That&apos;s
              the same activity, just untracked. Win-win-win for you, your friend, and the
              brand. But hey, your call.)
            </p>

            <p className="mt-4 text-base text-navy-700">
              <span className="font-semibold text-navy-900">
                You can run this completely anonymous.
              </span>{" "}
              No selfie. No followers. No telling Aunt Linda what you&apos;re doing.
            </p>

            <p className="mt-4 text-base text-navy-700">A million places your link can live:</p>

            <ul className="mt-4 grid gap-2 text-base text-navy-700 sm:grid-cols-2">
              <li className="flex gap-2"><span className="text-coral-500">→</span> A faceless TikTok or IG account in any niche</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> Comments under YouTube videos people already watch</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> Subreddits where someone&apos;s asking &ldquo;what should I stream tonight?&rdquo;</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> Quora answers that rank on Google for years</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> Niche Facebook groups (mom-and-baby, beauty, finance, anything)</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> A blog post you write once and never touch again</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> Forum threads from 2019 that still pull traffic</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> Pinterest pins, Discord servers, comment sections, anywhere</li>
            </ul>

            <p className="mt-6 text-base text-navy-700">
              That comment lives on the internet{" "}
              <span className="font-semibold text-navy-900">forever.</span> Anyone who
              clicks it — today, next week, in 2030 — earns you a commission. You
              wrote it once. It works for you while you do literally anything else.
            </p>

            <p className="mt-4 text-base text-navy-700">
              The link is the link. Where you put it is up to you.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          The unfair advantage
        </p>
        <h2 className="mt-2 text-4xl text-navy-900">
          Plot twist: you don&apos;t even have to write any of it.
        </h2>

        <div className="mt-10 grid items-start gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-base text-navy-700">
              It&apos;s 2026. ChatGPT, Claude, Gemini, Canva, CapCut,
              ElevenLabs — all basically free. The part of affiliate marketing
              that used to take four hours of writing, editing, and second-guessing
              now takes about four minutes.
            </p>

            <p className="text-base text-navy-700">
              We baked it right into your dashboard. It&apos;s a wrapper around
              the same models the pros pay for — Claude, GPT, Gemini — but pointed
              at one job:{" "}
              <span className="font-semibold text-navy-900">
                turn your link into something a real person actually wants to click.
              </span>
            </p>

            <p className="text-base text-navy-700">
              Pick a brand. Pick a platform. Pick a tone. Get back, in about 6 seconds:
            </p>

            <ul className="space-y-2 text-base text-navy-700">
              <li className="flex gap-2"><span className="text-coral-500">→</span> 5 TikTok hooks tied to that brand</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> A Reddit post that doesn&apos;t read like an ad</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> A 3-paragraph blog draft optimized for Google</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> 10 Pinterest pin ideas with copy + image prompts</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> Caption variants for IG, X, and Threads</li>
              <li className="flex gap-2"><span className="text-coral-500">→</span> A voiceover script and a thumbnail prompt for Midjourney</li>
            </ul>

            <p className="text-base text-navy-700">
              Example: pick HBO Max. Ask for &ldquo;5 TikTok hooks for moms who
              like prestige drama.&rdquo; You get 5 ready-to-film hooks, a
              voiceover script, and a thumbnail prompt — all in seconds. Pop the
              best one into CapCut. Done before the kids finish breakfast.
            </p>

            <p className="text-base text-navy-700">
              Translation:{" "}
              <span className="font-semibold text-navy-900">
                the part of this game that used to gatekeep everyone — &ldquo;I&apos;m
                not a writer, I&apos;m not a creator&rdquo; — is solved.
              </span>{" "}
              The AI does the writing. The internet does the distribution. You bring
              the link. Your bank account brings the dollars.
            </p>
          </div>

          <div className="flex justify-center md:justify-end md:sticky md:top-8">
            <AIStudioPreview />
          </div>
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
