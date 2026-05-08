import type { Metadata } from "next";
import MarketingShell from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Privacy Policy — MomFluence",
  description: "How MomFluence collects, uses, and protects your personal information.",
};

const lastUpdated = "May 8, 2026";

export default function Privacy() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-3xl px-6 pt-16 pb-20">
        <h1 className="text-4xl text-navy-900">Privacy Policy</h1>
        <p className="text-sm text-navy-500">Last updated: {lastUpdated}</p>

        <p className="mt-6 text-navy-700">
          MomFluence (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) operates the MomFluence platform at
          momfluence.app and related subdomains. This Privacy Policy explains what information we collect, how we
          use it, and your rights to control it.
        </p>

        <h2 className="text-2xl mt-10 text-navy-900">1. Information we collect</h2>
        <p className="mt-3 text-navy-700">When you sign up and use MomFluence, we collect:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-navy-700">
          <li><strong>Account information:</strong> email address, password (hashed), and any optional profile fields you provide.</li>
          <li><strong>Payment information:</strong> billing details and payment method tokens, processed and stored by Stripe. We never receive or store full credit-card numbers.</li>
          <li><strong>Payout information:</strong> bank account or debit card details, collected and stored by Stripe Connect for the purpose of paying out earned commissions.</li>
          <li><strong>Activity data:</strong> click events, conversion events, link generation, dashboard usage.</li>
          <li><strong>Device data:</strong> IP address, browser user-agent, referrer, and approximate location derived from IP.</li>
          <li><strong>Communications:</strong> messages you send to support and your responses to surveys or emails.</li>
        </ul>

        <h2 className="text-2xl mt-8 text-navy-900">2. How we use your information</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-navy-700">
          <li>To operate the platform: authenticate you, generate tracked links, attribute conversions, calculate earnings, and disburse payouts.</li>
          <li>To process payments and prevent fraud, via Stripe.</li>
          <li>To improve the platform: identify and fix bugs, prioritize features, evaluate ad effectiveness.</li>
          <li>To communicate with you about your account, payouts, policy changes, and (with your consent) marketing.</li>
          <li>To comply with legal obligations, including tax reporting where applicable.</li>
        </ul>

        <h2 className="text-2xl mt-8 text-navy-900">3. Cookies and tracking</h2>
        <p className="mt-3 text-navy-700">
          We use first-party cookies for authentication and session management. We use third-party advertising and
          analytics technologies including the Meta (Facebook) Pixel and Conversions API, Google Analytics, and
          Stape Conversions API Gateway, to measure marketing effectiveness and serve relevant ads.
        </p>
        <p className="mt-3 text-navy-700">
          For Meta ads, we share with Meta a hashed version of your email address and IP, plus event data such as
          page views, sign-up starts, and purchases. You can opt out of personalized advertising in your browser
          settings or via your Facebook Ad Preferences.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">4. How we share information</h2>
        <p className="mt-3 text-navy-700">
          We share information only with service providers who help us run the platform, including:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-navy-700">
          <li><strong>Stripe</strong> — payments, customer billing portal, payouts (Stripe Connect Express).</li>
          <li><strong>Supabase</strong> — database, authentication, server hosting.</li>
          <li><strong>Vercel</strong> — application hosting and CDN.</li>
          <li><strong>Meta / Stape</strong> — advertising attribution and conversions API.</li>
          <li><strong>Google</strong> — analytics.</li>
          <li><strong>Brand affiliate networks</strong> — to attribute conversions back to your account, we share an opaque sub-ID with the offer's network. We do not share your email or personal info with brands.</li>
        </ul>
        <p className="mt-3 text-navy-700">
          We do not sell your personal information.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">5. Data retention</h2>
        <p className="mt-3 text-navy-700">
          We retain account data for as long as your account is active and for up to seven years after closure for
          tax and accounting purposes. Click and conversion data is retained for five years to support payout
          dispute resolution. You may request earlier deletion of identifiable data — see Section 7.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">6. Security</h2>
        <p className="mt-3 text-navy-700">
          We use industry-standard security practices: TLS in transit, encryption at rest where supported, hashed
          passwords, scoped database access via row-level security, and least-privilege service tokens. No system
          is perfectly secure; if we discover a breach affecting your data, we will notify you in accordance with
          applicable law.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">7. Your rights</h2>
        <p className="mt-3 text-navy-700">
          Depending on your location, you may have the right to access, correct, or delete personal information we
          hold about you, restrict or object to certain processing, and request data portability. To exercise these
          rights, email <a href="mailto:hello@momfluence.app">hello@momfluence.app</a>. We respond within 30 days.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">8. Children</h2>
        <p className="mt-3 text-navy-700">
          MomFluence is not directed at children under 13. We do not knowingly collect information from children.
          If you believe a child has provided us information, contact us and we will delete it.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">9. International transfers</h2>
        <p className="mt-3 text-navy-700">
          MomFluence is operated from the United States. If you access the platform from outside the U.S., your
          information will be transferred to and processed in the U.S.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">10. Changes to this policy</h2>
        <p className="mt-3 text-navy-700">
          We may update this policy. Material changes will be notified by email or in-app notice at least 14 days
          before they take effect.
        </p>

        <h2 className="text-2xl mt-8 text-navy-900">11. Contact</h2>
        <p className="mt-3 text-navy-700">
          Questions, requests, or concerns: <a href="mailto:hello@momfluence.app">hello@momfluence.app</a>.
        </p>
      </main>
    </MarketingShell>
  );
}
