import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Earnings Disclaimer",
  description:
    "The official MomFluence earnings disclaimer. Any earnings figures shown on our marketing pages are illustrative examples and not guarantees of future results.",
  openGraph: {
    title: "Earnings Disclaimer — MomFluence.app",
    description:
      "Earnings shown on MomFluence are illustrative examples, not guarantees. Individual results vary.",
  },
  robots: { index: true, follow: true },
};

export default function EarningsDisclaimer() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
        Disclosures
      </p>
      <h1 className="mt-2 text-4xl text-navy-900">Earnings Disclaimer</h1>
      <p className="mt-3 text-sm text-navy-500">Last updated: May 18, 2026</p>

      <div className="mt-10 space-y-10 text-base leading-7 text-navy-700">
        <section>
          <p>
            This disclaimer applies to any earnings figure, dollar amount,
            example, projection, or income claim referenced on MomFluence
            marketing pages, landing pages, member dashboards, social media
            posts, ads, emails, and any other channel where MomFluence (or its
            members acting on its behalf) communicates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Examples are not guarantees</h2>
          <p className="mt-4">
            Any specific dollar amounts, monthly earnings, payout figures,
            commission percentages, or projection numbers shown on our pages
            are{" "}
            <span className="font-semibold text-navy-900">
              illustrative examples
            </span>
            , not predictions or guarantees of what any individual will earn.
            We use specific numbers in examples because vague language is
            harder to understand &mdash; but those numbers are not promises.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Individual results vary</h2>
          <p className="mt-4">
            Actual earnings depend on factors that are different for every
            member, including:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>How often you share tracked links</li>
            <li>Where you share them (some channels convert better than others)</li>
            <li>Who you share with (audiences vary in their conversion rates)</li>
            <li>Which brand programs you choose to promote</li>
            <li>The current commission rates set by those brands</li>
            <li>Seasonal factors and broader market conditions</li>
            <li>
              Brand-side fraud-prevention timelines (some brands clear
              commissions in 24 hours; others take 30-60 days)
            </li>
          </ul>
          <p className="mt-4">
            Some members earn substantially more than the examples we show;
            others earn substantially less or nothing at all if they never
            actively share links. There is no minimum earning guarantee.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Typical first-month earnings</h2>
          <p className="mt-4">
            Based on our internal data as of May 2026, most active first-month
            members (defined as members who generate at least one tracked link
            and share it at least once) earn between $15 and $75 in their
            first 30 days. These figures are an average snapshot, not a
            promise; they include the long tail of members who earn $0 because
            they never shared anything, and they exclude outlier high earners.
          </p>
          <p className="mt-4">
            Commissions from recurring-subscription brands (streaming services,
            apps) typically compound over months &mdash; meaning a member&apos;s
            second-month and third-month earnings are usually higher than
            their first, because last month&apos;s referrals are still
            generating monthly commissions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">No income guarantees</h2>
          <p className="mt-4">
            MomFluence does not guarantee any specific level of income,
            commissions, payouts, or success. Joining MomFluence is not a
            replacement for a job, salary, or other stable income source.
            Anyone presenting MomFluence as a way to &ldquo;quit your job&rdquo;
            or earn a specific income figure is making claims that exceed
            what we ourselves promise.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Pricing test (Variant B): the $5 credit-back</h2>
          <p className="mt-4">
            Some of our marketing pages run a pricing-positioning test that
            describes a $5 credit returned to a member&apos;s dashboard
            balance once their cumulative commission earnings reach $25. The
            terms of that credit-back mechanic are governed by our{" "}
            <Link href="/terms#membership-credit" className="underline">
              Terms of Service
            </Link>
            . Briefly: subscription is billed monthly at $5, and a one-time
            $5 credit is applied to the dashboard balance the next billing
            cycle after cumulative earnings first cross the $25 threshold.
            The credit is not a refund to the original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Federal Trade Commission compliance</h2>
          <p className="mt-4">
            This disclaimer is provided to comply with the U.S. Federal Trade
            Commission&apos;s rules on truthful and substantiated earnings
            claims in advertising. If you ever see a claim from MomFluence
            (including from one of our members posting on our behalf) that
            appears to overstate likely earnings or guarantee results, please
            flag it to us at{" "}
            <a href="mailto:hello@momfluence.app" className="underline">
              hello@momfluence.app
            </a>{" "}
            and we will investigate.
          </p>
        </section>

        <p className="text-sm text-navy-500">
          See also:{" "}
          <Link href="/disclosures/affiliate-marketing" className="underline">
            Affiliate Marketing Disclosure
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
