import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MomFluence collects, uses, and protects your personal information.",
  openGraph: {
    title: "Privacy Policy — MomFluence.app",
    description:
      "How MomFluence collects, uses, and protects your personal information."
  }
};

export default function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl text-navy-900">Privacy Policy</h1>
      <p className="mt-3 text-sm text-navy-500">Last updated: May 8, 2026</p>

      <div className="mt-10 space-y-10 text-base leading-7 text-navy-700">
        <section>
          <p>
            This Privacy Policy describes how Never Peak Inc. (&ldquo;Never Peak,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and
            shares your personal information when you use MomFluence (the
            &ldquo;Service&rdquo;) at momfluence.app. By using the Service, you agree to
            this Privacy Policy and our Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Information we collect</h2>
          <p className="mt-4">
            We collect information you provide directly to us, information generated through
            your use of the Service, and information from third parties that work with us to
            deliver the Service.
          </p>

          <p className="mt-6 font-semibold text-navy-900">Account information</p>
          <p className="mt-2">
            When you create an account, we collect your email address and a password (stored
            in hashed form, never as plain text).
          </p>

          <p className="mt-6 font-semibold text-navy-900">Payment information</p>
          <p className="mt-2">
            Subscription payments are processed by Stripe, our payment processor. Stripe
            collects your payment card details directly. We do not store your full card
            number, expiration date, or CVV. We do receive and store the last four digits of
            your card, the card brand, your billing ZIP code, and a Stripe customer ID
            associated with your account for billing reference.
          </p>

          <p className="mt-6 font-semibold text-navy-900">Click and conversion data</p>
          <p className="mt-2">
            When you generate tracked links and someone clicks them, we record the click
            event, the timestamp, the destination brand, and a hashed approximation of the
            click source IP address. When the click results in a confirmed purchase, the
            affiliate network reports the conversion to us, and we associate it with your
            account so we can pay you the commission.
          </p>

          <p className="mt-6 font-semibold text-navy-900">Payout method information</p>
          <p className="mt-2">
            When you request a withdrawal, we collect the payout details you choose to
            provide: a PayPal email address, a Venmo handle and phone number, or
            bank-transfer details. We use this information solely to send you your earnings.
          </p>

          <p className="mt-6 font-semibold text-navy-900">Tax information</p>
          <p className="mt-2">
            When your cumulative earnings reach $600 (the IRS 1099-NEC threshold), we
            collect a completed Form W-9, which includes your legal name, address, and
            taxpayer identification number (TIN). We store only the last four digits of your
            TIN in our application database; if your full TIN is required for IRS filing, it
            is held in encrypted storage.
          </p>

          <p className="mt-6 font-semibold text-navy-900">Device and usage information</p>
          <p className="mt-2">
            We collect standard web traffic information including IP addresses, browser
            type, device type, referring URLs, pages visited, and timestamps. This is used
            for analytics, security, and fraud prevention.
          </p>

          <p className="mt-6 font-semibold text-navy-900">Cookies and similar technologies</p>
          <p className="mt-2">
            We use cookies and similar technologies for authentication, session persistence,
            preferences, conversion tracking, and analytics. Some cookies are set by
            third-party services described in &ldquo;Service providers&rdquo; below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">How we use your information</h2>
          <p className="mt-4">We use the information we collect to:</p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Provide, operate, and maintain the Service</li>
            <li>Process your subscription payments and send your earnings payouts</li>
            <li>
              Track conversions from your affiliate links and credit you with commissions
            </li>
            <li>Detect, prevent, and address fraud and abuse</li>
            <li>
              Comply with our legal obligations, including IRS tax-reporting requirements
            </li>
            <li>Communicate with you about your account, the Service, and our policies</li>
            <li>Improve the Service through analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Service providers</h2>
          <p className="mt-4">
            We share information with third-party service providers that help us deliver the
            Service. These include:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-navy-900">Stripe</span> for subscription
              payment processing and customer billing portal hosting.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Supabase</span> for database
              hosting, authentication, and file storage.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Vercel</span> for application
              hosting.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Meta Platforms</span> for
              advertising attribution via the Meta Pixel and Conversions API. We share
              hashed identifiers (such as hashed email and Stripe customer ID) and event
              data to enable attribution. We use Stape&apos;s hosted Conversions API
              Gateway as our server-side relay to Meta.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Google</span> (Google Analytics)
              for web analytics.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Affiliate networks</span> (such
              as Impact, FlexOffers, CJ, and others) for click and conversion tracking. We
              share click-event identifiers with these networks. We do not share your name
              or email with the brands themselves.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Email delivery providers</span>{" "}
              for transactional and notification emails.
            </li>
          </ul>
          <p className="mt-4">
            We require service providers to use your information only for the purposes for
            which we share it and to keep it protected.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Disclosures required by law</h2>
          <p className="mt-4">
            We may disclose your information if required by law, subpoena, court order, or
            other legal process; to enforce our Terms of Service; or to protect the safety,
            rights, or property of Never Peak, our members, or others.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Your rights</h2>
          <p className="mt-4">
            You have rights regarding your personal information. You may:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>
              Request deletion of your account and associated personal information after
              cancellation, subject to records we are required by law to retain
            </li>
            <li>Opt out of marketing communications at any time</li>
            <li>
              Object to or restrict certain types of processing, where applicable under your
              local law
            </li>
          </ul>
          <p className="mt-4">
            To exercise these rights, email{" "}
            <a href="mailto:hello@momfluence.app">hello@momfluence.app</a>. We will respond
            within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Data retention</h2>
          <p className="mt-4">
            We retain personal information for as long as your account is active. After
            account cancellation, we retain financial and tax records for seven years to
            satisfy IRS recordkeeping requirements. Other personal information associated
            with your account is deleted within ninety days of a verified deletion request,
            except where retention is necessary to comply with legal obligations or resolve
            disputes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Children&apos;s privacy</h2>
          <p className="mt-4">
            The Service is not directed at children under thirteen, and we do not knowingly
            collect personal information from children under thirteen. If we learn we have
            collected such information, we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">International users</h2>
          <p className="mt-4">
            The Service is operated from the United States. By using the Service, you
            consent to the transfer and processing of your information in the United States,
            which may have data-protection laws different from those in your country.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Changes to this Privacy Policy</h2>
          <p className="mt-4">
            We may update this Privacy Policy from time to time. We will post the updated
            policy at this URL and update the &ldquo;Last updated&rdquo; date above. For
            material changes, we will provide additional notice (such as an email or an
            in-product notification).
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Contact us</h2>
          <p className="mt-4">
            If you have questions about this Privacy Policy or our data practices, contact
            us at <a href="mailto:hello@momfluence.app">hello@momfluence.app</a>.
          </p>
          <p className="mt-4">
            Never Peak Inc., El Segundo, California, United States.
          </p>
        </section>
      </div>
    </main>
  );
}
