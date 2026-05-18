import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of MomFluence, including membership, payouts, and content guidelines.",
  openGraph: {
    title: "Terms of Service — MomFluence.app",
    description: "The terms that govern your use of MomFluence."
  }
};

export default function Terms() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl text-navy-900">Terms of Service</h1>
      <p className="mt-3 text-sm text-navy-500">Last updated: May 18, 2026</p>

      <div className="mt-10 space-y-10 text-base leading-7 text-navy-700">
        <section>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of MomFluence (the
            &ldquo;Service&rdquo;) operated by Never Peak Inc. (&ldquo;Never Peak,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an
            account or using the Service, you agree to be bound by these Terms. If you do
            not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Eligibility</h2>
          <p className="mt-4">
            You must be at least eighteen years old and able to enter into a legally binding
            contract to use the Service. By using the Service, you represent that you meet
            these requirements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Account registration</h2>
          <p className="mt-4">
            You agree to provide accurate, current, and complete information during
            registration and to keep your account information up to date. You are
            responsible for safeguarding your account credentials and for any activity that
            occurs under your account. Notify us immediately at{" "}
            <a href="mailto:hello@momfluence.app">hello@momfluence.app</a> if you suspect
            unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Membership and billing</h2>
          <p className="mt-4">
            Membership in the Service costs $5 per month, billed automatically each month
            until cancelled. Payments are processed by Stripe. By providing payment
            information, you authorize us to charge the amount due to your selected payment
            method on each billing date.
          </p>
          <p className="mt-4">
            Your subscription renews automatically each calendar month at the then-current
            price. If we change our pricing, we will notify you in advance of any change
            taking effect, and you may cancel before the change takes effect if you do not
            agree.
          </p>
        </section>

        <section id="membership-credit">
          <h2 className="text-2xl text-navy-900">Membership credit (when applicable)</h2>
          <p className="mt-4">
            Some marketing pages run a pricing-positioning test that describes
            a one-time $5 credit returned to your dashboard balance once your
            cumulative commission earnings first cross $25. If you signed up
            from a page describing this credit, the following terms apply:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold text-navy-900">When the credit
              applies:</span> after your verified, brand-confirmed
              cumulative commission earnings reach $25.00 for the first time
              under your account.
            </li>
            <li>
              <span className="font-semibold text-navy-900">What the credit
              is:</span> a one-time $5.00 credit added to your in-platform
              dashboard balance. The credit is applied within seven business
              days of the qualifying earnings threshold being crossed.
            </li>
            <li>
              <span className="font-semibold text-navy-900">What the credit
              is not:</span> the credit is not a refund returned to your
              original payment method, not redeemable for cash, and not
              transferable. Subscription billing continues monthly at $5
              regardless of whether the credit has been applied.
            </li>
            <li>
              <span className="font-semibold text-navy-900">One credit per
              account:</span> only one $5 credit is issued per account, ever.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Cancellation:</span>{" "}
              if you cancel your membership before crossing the $25 earnings
              threshold, you do not become eligible for the credit. Past
              earnings remain yours per the standard payout rules.
            </li>
            <li>
              <span className="font-semibold text-navy-900">Identification:</span>{" "}
              your eligibility for this term depends on which pricing
              variant you saw at signup. The signup metadata records
              <span className="font-mono"> pricing_variant=B</span> for
              accounts under this term. If you&apos;re unsure whether this
              applies to you, email{" "}
              <a href="mailto:hello@momfluence.app" className="underline">
                hello@momfluence.app
              </a>{" "}
              and we&apos;ll confirm.
            </li>
          </ul>
          <p className="mt-4">
            This credit mechanism is a marketing test that may be revised or
            withdrawn for future signups. Members who signed up under it
            retain the terms in effect at the time of signup.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Cancellation and refunds</h2>
          <p className="mt-4">
            You may cancel your subscription at any time through your customer billing
            portal or by emailing{" "}
            <a href="mailto:hello@momfluence.app">hello@momfluence.app</a>. Cancellation
            takes effect at the end of your current paid period; you will retain access to
            the Service through that date.
          </p>
          <p className="mt-4">
            We do not pro-rate or refund partial months (industry standard). If you believe
            you were charged in error or experienced a billing issue, contact us and we will
            work with you in good faith to resolve it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Member responsibilities</h2>
          <p className="mt-4">When using the Service, you agree to:</p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>
              Comply with all applicable laws, including the Federal Trade Commission&apos;s
              endorsement and disclosure rules. We provide disclosure templates to help you
              comply.
            </li>
            <li>
              Disclose your affiliate relationship clearly and conspicuously when posting
              tracked links, including in social media captions, blog posts, email
              newsletters, and any other channel where you share links.
            </li>
            <li>
              Not make false or misleading claims about products, brands, earnings, or the
              Service itself.
            </li>
            <li>
              Not engage in spam, link manipulation, click fraud, cookie stuffing, or other
              deceptive practices designed to generate fake conversions.
            </li>
            <li>Not scrape, copy, or redistribute MomFluence content without permission.</li>
            <li>
              When using AI-generated content (including text generated by ChatGPT or
              similar tools), comply with FTC disclosure rules and any platform-specific
              labeling requirements (Instagram, TikTok, etc.).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Earnings, attribution, and payouts</h2>
          <p className="mt-4">
            When you generate a tracked link and a customer makes a qualifying purchase
            through that link, the underlying affiliate network reports a conversion to us
            and credits MomFluence with a commission. We pass that commission through to
            you net of any fraud reversals or chargebacks reported by the network.
          </p>
          <p className="mt-4">
            Conversions clear within thirty days under standard affiliate-network terms.
            Some networks have longer clearance windows, in which case payouts wait for
            clearance.
          </p>
          <p className="mt-4">
            Our standard payout rules:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Minimum withdrawal threshold: $50</li>
            <li>Maximum two withdrawal requests per calendar month</li>
            <li>Withdrawals processed within thirty days of approval</li>
            <li>Payouts via PayPal, Venmo, or bank transfer based on your preference</li>
          </ul>
          <p className="mt-4">
            Each member is also entitled to one fast-track payout in their first ninety
            days. The fast-track payout has a $25 minimum threshold instead of the standard
            $50. To protect against chargeback exposure, the fast-track payout is capped at
            $25 if requested within the first thirty days from signup. The fast-track is a
            one-time perk per account; once used, the standard payout rules apply for all
            future withdrawals.
          </p>
          <p className="mt-4">
            We pass through what affiliate networks pay us. If a network reverses a
            conversion (for fraud, customer return, chargeback, or other reasons) after we
            have already paid you, we may deduct the reversed amount from your future
            earnings. We will not seek repayment for amounts already disbursed in good
            faith.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Tax compliance</h2>
          <p className="mt-4">
            Once your cumulative earnings on the Service reach $600 in a calendar year, IRS
            rules require us to collect a completed Form W-9 before we can issue further
            payouts to you. You will receive an in-product prompt to complete the W-9 when
            you reach the threshold. We will issue you a Form 1099-NEC in January for any
            calendar year in which you crossed the threshold. You are responsible for
            reporting your earnings and paying any applicable taxes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Suspension and termination</h2>
          <p className="mt-4">
            We may suspend or terminate your account, with or without notice, if we believe
            you have violated these Terms, engaged in fraudulent activity, violated FTC or
            other applicable rules, or otherwise acted in a way that could expose us or
            other members to legal or financial risk.
          </p>
          <p className="mt-4">
            On termination, your right to access the Service ends immediately. We will pay
            out any cleared, non-fraudulent earnings owed to you, subject to our standard
            payout rules and any verification we reasonably require.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Intellectual property</h2>
          <p className="mt-4">
            We retain all rights, title, and interest in the Service, including the
            MomFluence name, logo, and all content we provide. You retain ownership of any
            content you create using the Service, including your captions, posts, and
            promotional materials. You grant us a limited license to display your content
            within the Service to the extent necessary to operate it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Disclaimers</h2>
          <p className="mt-4">
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
            basis. We do not guarantee any specific level of earnings. Earnings depend on
            many factors outside our control, including your audience, the products you
            promote, market conditions, and affiliate-network performance.
          </p>
          <p className="mt-4">
            To the fullest extent permitted by law, we disclaim all implied warranties
            including merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Limitation of liability</h2>
          <p className="mt-4">
            To the fullest extent permitted by law, Never Peak&apos;s total liability for
            any claim arising out of or relating to the Service is limited to the amount you
            paid us in subscription fees during the twelve months preceding the claim. We
            are not liable for indirect, incidental, special, consequential, or punitive
            damages.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Indemnification</h2>
          <p className="mt-4">
            You agree to defend, indemnify, and hold harmless Never Peak from any claim,
            damage, loss, or expense (including reasonable attorneys&apos; fees) arising
            from your use of the Service, your violation of these Terms, or your violation
            of any law or third-party right (including FTC disclosure rules).
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Dispute resolution</h2>
          <p className="mt-4">
            Any dispute arising out of or relating to these Terms or the Service will be
            resolved by binding arbitration administered by JAMS in California, in
            accordance with its rules then in effect. Judgment on the arbitrator&apos;s
            award may be entered in any court of competent jurisdiction. You and Never Peak
            each waive the right to a jury trial and to participate in any class action.
          </p>
          <p className="mt-4">
            These Terms are governed by the laws of the State of California, excluding
            conflict-of-laws principles.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Changes to these Terms</h2>
          <p className="mt-4">
            We may revise these Terms from time to time. The most current version is always
            posted at this URL with the &ldquo;Last updated&rdquo; date. Material changes
            will be communicated by email or in-product notice. Continued use of the Service
            after a change takes effect constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Contact</h2>
          <p className="mt-4">
            Questions about these Terms? Email{" "}
            <a href="mailto:hello@momfluence.app">hello@momfluence.app</a>.
          </p>
          <p className="mt-4">
            Never Peak Inc., El Segundo, California, United States.
          </p>
        </section>
      </div>
    </main>
  );
}
