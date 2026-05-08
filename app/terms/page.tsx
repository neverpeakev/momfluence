import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Terms of Service — MomFluence",
  description: "MomFluence Terms of Service.",
};

const lastUpdated = "May 8, 2026";

export default function Terms() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-3xl px-6 pt-16 pb-20">
        <h1 className="text-4xl text-navy-900">Terms of Service</h1>
        <p className="text-sm text-navy-500">Last updated: {lastUpdated}</p>

        <p className="mt-6 text-navy-700">
          These Terms govern your use of MomFluence (&ldquo;the Platform&rdquo;), operated at momfluence.app and
          related subdomains. By creating an account or using the Platform, you agree to these Terms.
        </p>

        <h2 className="text-2xl mt-10 text-navy-900">1. Eligibility</h2>
        <p className="mt-3 text-navy-700">
          You must be at least 18 years old and able to form a binding contract under U.S. law. You agree to
          provide accurate account and tax information.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">2. Membership and billing</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-navy-700">
          <li>MomFluence is a paid membership at $5.00 USD per month, billed in advance via Stripe.</li>
          <li>Your subscription renews automatically each month until cancelled.</li>
          <li>You may cancel anytime from the Stripe customer portal linked in your account. Cancellation takes effect at the end of the current billing period; we do not refund the unused portion of a billed month.</li>
          <li>If a payment fails, your access may be suspended until the payment succeeds. We may retry the charge in line with Stripe&rsquo;s standard retry rules.</li>
          <li>Prices may change. We will notify you by email at least 30 days before any price increase, and you may cancel before the new price takes effect.</li>
        </ul>

        <h2 className="text-2xl mt-8 text-navy-900">3. Member earnings and payouts</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-navy-700">
          <li>Conversions you drive may be eligible for commissions paid by the offering brand or affiliate network. Eligibility, attribution rules, and payout amounts are determined by the brand.</li>
          <li>We pay out approved commissions on a NET-30 basis via Stripe Connect Express to a bank account or debit card you connect during onboarding.</li>
          <li>Payouts run automatically on the 1st and 15th of each month, subject to a $50.00 USD minimum balance.</li>
          <li>Reversed conversions (returns, fraud, brand chargebacks) are deducted from your future earnings balance. We do not claw back from already-disbursed payouts.</li>
          <li>You are responsible for paying any taxes owed on amounts paid to you. We may issue 1099 forms where required by U.S. law.</li>
        </ul>

        <h2 className="text-2xl mt-8 text-navy-900">4. Content and conduct</h2>
        <p className="mt-3 text-navy-700">When sharing tracked links, you agree to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-navy-700">
          <li>Disclose your relationship with MomFluence and the brand in compliance with FTC Endorsement Guides (we provide template language).</li>
          <li>Not engage in incentivized clicks, misleading representations, or fake-account traffic.</li>
          <li>Not use paid advertising on the brand&rsquo;s own keywords or trademark terms unless explicitly permitted.</li>
          <li>Not engage in cookie stuffing, click farming, or any form of fraudulent attribution.</li>
          <li>Comply with applicable laws including consumer protection, advertising, and privacy laws.</li>
        </ul>
        <p className="mt-3 text-navy-700">
          We may suspend or terminate your account at any time for violations, and forfeit unpaid earnings tied to fraudulent traffic.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">5. Brand offers and availability</h2>
        <p className="mt-3 text-navy-700">
          The catalog of available offers may change without notice. A brand may pause its program, change payout
          terms, or terminate the relationship; we pass those changes through. We make no guarantee that any
          specific offer will remain available or that earnings will reach a particular level.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">6. Intellectual property</h2>
        <p className="mt-3 text-navy-700">
          The MomFluence name, logo, and software are owned by us. You receive a limited, non-exclusive,
          non-transferable license to use the Platform for as long as your membership is active.
        </p>
        <p className="mt-3 text-navy-700">
          You retain ownership of your social posts and creative content. By sharing tracked links, you grant us
          permission to attribute resulting conversions and report them to brands and you.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">7. Termination</h2>
        <p className="mt-3 text-navy-700">
          You may terminate your account at any time. We may terminate or suspend access for violation of these
          Terms, fraud, abuse, non-payment, or where required by law. After termination, your tracked links may
          stop working immediately.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">8. Disclaimers</h2>
        <p className="mt-3 text-navy-700">
          THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo; WE DISCLAIM ALL WARRANTIES,
          EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          WE DO NOT GUARANTEE ANY PARTICULAR LEVEL OF EARNINGS OR ATTRIBUTION ACCURACY.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">9. Limitation of liability</h2>
        <p className="mt-3 text-navy-700">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATED
          TO THESE TERMS OR THE PLATFORM WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12
          MONTHS PRECEDING THE CLAIM OR (B) $100.00 USD. WE WILL NOT BE LIABLE FOR INDIRECT, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">10. Governing law and disputes</h2>
        <p className="mt-3 text-navy-700">
          These Terms are governed by the laws of the State of California, without regard to conflict-of-law
          rules. Disputes will be resolved by binding individual arbitration in California, except either party
          may bring an action in small-claims court for qualifying disputes. You and we waive the right to a jury
          trial and to participate in a class action.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">11. Changes to these Terms</h2>
        <p className="mt-3 text-navy-700">
          We may update these Terms. Material changes will be notified by email or in-app notice at least 14 days
          before they take effect. Continued use after the effective date constitutes acceptance.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">12. Contact</h2>
        <p className="mt-3 text-navy-700">
          Questions or notices: <a href="mailto:hello@momfluence.app">hello@momfluence.app</a>. See our{" "}
          <Link href="/privacy">Privacy Policy</Link> for how we handle your data.
        </p>
      </main>
    </MarketingShell>
  );
}
