import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import JoinCTA from "@/components/JoinCTA";

export const metadata: Metadata = {
  title: "For Moms — MomFluence",
  description:
    "Curated, hand-picked, pre-vetted brand partnerships for Moms. No applications. No wait periods. Share your link. Get paid for every conversion.",
  openGraph: {
    title: "For Moms — MomFluence",
    description:
      "Curated, hand-picked, pre-vetted brand partnerships for Moms. Share your link. Get paid.",
    url: "https://momfluence.app/for-influencers",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "For Moms — MomFluence" },
};

export default function ForInfluencers() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-3xl px-6 pt-16 pb-20">
        <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">For Moms</p>
        <h1 className="mt-3 text-4xl sm:text-5xl text-navy-900 leading-tight">
          You already recommend the products you love. Now get paid for it.
        </h1>
        <p className="mt-6 text-lg text-navy-600">
          MomFluence is a curated brand partnership platform for Moms. Hand-picked offers from pre-vetted brands.
          Share your tracked link. Earn a real cut on every conversion.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <JoinCTA label="Join for $5/mo" />
          <Link href="/how-it-works" className="btn-ghost no-underline">See how it works</Link>
        </div>

        <section className="mt-16">
          <h2 className="text-3xl text-navy-900">The problem with most affiliate programs</h2>
          <p className="mt-4 text-navy-600">
            Joining brand-by-brand is brutal. You apply to one program. Wait three weeks. Get rejected for not having
            10k followers. Try the next. Get accepted but the dashboard is broken. Track down a payout that finally
            shows up four months later. Repeat for every brand you want to recommend.
          </p>
          <p className="mt-4 text-navy-600">
            Mom influencers don't have time for that. Most of you are already running a household, a small business,
            or both. So real recommendations — the kind your friends actually act on — go uncompensated.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl text-navy-900">What MomFluence does instead</h2>
          <p className="mt-4 text-navy-600">
            We do the program-hunting, vetting, and negotiation work once — for the whole community.
            You get one membership, one dashboard, one link generator, one payout pipeline.
          </p>
          <ul className="mt-6 space-y-4">
            <li className="card">
              <h3 className="text-lg">Curated catalog</h3>
              <p className="mt-2 text-sm text-navy-600">
                Every brand is hand-picked for Mom audiences and pre-vetted for payout reliability. No 0.5% commission
                offers. No brands that don't pay out for 6 months. If we wouldn't share it ourselves, it doesn't make
                the catalog.
              </p>
            </li>
            <li className="card">
              <h3 className="text-lg">One click, one link</h3>
              <p className="mt-2 text-sm text-navy-600">
                Pick an offer. Click "Get my link." Done. The short link is tagged to your account so every click and
                conversion attributes back to you, even if a friend forwards your DM.
              </p>
            </li>
            <li className="card">
              <h3 className="text-lg">Real-time tracking</h3>
              <p className="mt-2 text-sm text-navy-600">
                See clicks, conversions, and earnings as they happen. No black box. No "trust us." If a conversion
                fires, you see it within minutes.
              </p>
            </li>
            <li className="card">
              <h3 className="text-lg">NET-30 direct deposit</h3>
              <p className="mt-2 text-sm text-navy-600">
                Approved earnings clear in 30 days. Paid via Stripe direct deposit to your bank or debit card.
                $50 minimum payout, automatic on the 1st and 15th of every month.
              </p>
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl text-navy-900">Who it's for</h2>
          <p className="mt-4 text-navy-600">
            You don't need a million followers. You don't need a "personal brand." If you have friends who text you
            asking for product recommendations, you have an audience MomFluence can monetize.
          </p>
          <ul className="mt-4 list-disc pl-6 space-y-2 text-navy-600">
            <li>Moms with active group chats and texting circles.</li>
            <li>Moms with even small Facebook, Instagram, or TikTok presences (1k–100k+).</li>
            <li>Moms running a parenting blog, newsletter, or podcast.</li>
            <li>Moms in school PTA, church, or community groups where word-of-mouth moves products.</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl text-navy-900">What it costs</h2>
          <p className="mt-4 text-navy-600">
            $5/month membership. That's it. Cancel anytime in two clicks from your customer portal — no email
            required, no retention call.
          </p>
          <p className="mt-4 text-navy-600">
            Why we charge: it keeps the catalog clean. People who pay $5 share intentionally. Brands love that.
            We get higher payouts. You get higher payouts. The membership pays for itself the first time anyone in
            your group chat clicks "buy."
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <JoinCTA label="Join now — $5/mo" />
            <Link href="/pricing" className="btn-ghost no-underline">Compare to going solo</Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl text-navy-900">FAQ</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="font-semibold text-navy-900">Do I have to disclose that I'm earning commissions?</dt>
              <dd className="mt-2 text-navy-600">
                Yes — FTC rules require that. We provide copy-paste disclosure templates inside the dashboard so it's
                a one-line add to any post.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">Can I cancel?</dt>
              <dd className="mt-2 text-navy-600">
                Anytime, from your Stripe customer portal. No phone call, no save offer.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">When and how do I get paid?</dt>
              <dd className="mt-2 text-navy-600">
                NET-30 from approved conversion. We pay out automatically on the 1st and 15th of every month via
                Stripe direct deposit (bank or debit card). $50 minimum.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">What if a brand reverses a conversion (return, fraud)?</dt>
              <dd className="mt-2 text-navy-600">
                Reversals are deducted from the next payout. Your dashboard shows the reason and the date. We don't
                claw back from already-disbursed payouts.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">Do I have to post on a schedule?</dt>
              <dd className="mt-2 text-navy-600">
                No. There's no content requirement. Share when you want, what you want.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-16 card bg-coral-50 ring-coral-100 text-center">
          <h2 className="text-3xl text-navy-900">Ready when you are.</h2>
          <p className="mt-3 text-navy-600">$5/month. Cancel anytime. No application or wait period.</p>
          <div className="mt-6 flex justify-center">
            <JoinCTA label="Join MomFluence" />
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
