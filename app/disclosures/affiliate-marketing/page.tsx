import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliate Marketing Disclosure",
  description:
    "How affiliate links work on MomFluence, our relationships with brand partners, and the disclosure rules our members agree to follow.",
  openGraph: {
    title: "Affiliate Marketing Disclosure — MomFluence.app",
    description:
      "How affiliate links work on MomFluence, our brand-partner relationships, and FTC disclosure rules for members.",
  },
  robots: { index: true, follow: true },
};

export default function AffiliateMarketingDisclosure() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
        Disclosures
      </p>
      <h1 className="mt-2 text-4xl text-navy-900">Affiliate Marketing Disclosure</h1>
      <p className="mt-3 text-sm text-navy-500">Last updated: May 18, 2026</p>

      <div className="mt-10 space-y-10 text-base leading-7 text-navy-700">
        <section>
          <h2 className="text-2xl text-navy-900">What MomFluence is</h2>
          <p className="mt-4">
            MomFluence is an affiliate-marketing platform operated by Never Peak
            Inc. (&ldquo;Never Peak,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;).
            We partner with brands that pay commissions when a customer is
            referred to them through a tracked link. Our members generate those
            tracked links, share them with friends and audiences, and earn a
            portion of the resulting commission revenue.
          </p>
          <p className="mt-4">
            We are not affiliated with, endorsed by, or sponsored by the brands
            we partner with. Brand names and logos are property of their
            respective owners and are used here under standard affiliate-partner
            usage rights granted by each brand&apos;s affiliate program.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">How we make money</h2>
          <p className="mt-4">
            We collect two types of revenue: (1) the $5/month membership fee
            from members, and (2) the difference between the gross commission
            paid by a brand on a referred conversion and the share we pass
            through to the referring member. Both revenue lines are
            transparently disclosed in our{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            and in member dashboards.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">FTC disclosure requirements for members</h2>
          <p className="mt-4">
            The U.S. Federal Trade Commission (FTC) requires that anyone who
            promotes a product or service in exchange for compensation
            disclose that relationship clearly and conspicuously. As a
            MomFluence member, when you share a tracked affiliate link you are
            in this category and the disclosure rule applies to you.
          </p>
          <p className="mt-4">
            <span className="font-semibold text-navy-900">
              What counts as &ldquo;clearly and conspicuously&rdquo;:
            </span>{" "}
            the disclosure must be near the link (not in a footer or buried
            page), readable on the device the post is being viewed on
            (mobile-friendly), and use language consumers actually understand.
            The FTC has stated that &ldquo;#ad&rdquo; or &ldquo;Affiliate
            link&rdquo; is acceptable; vague language like &ldquo;collab&rdquo;
            or &ldquo;sp&rdquo; is not.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Suggested disclosure language</h2>
          <p className="mt-4">
            Below are short disclosure templates our members are encouraged to
            use. These are starting points, not legal advice; consult a lawyer
            if your situation is complex.
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-6">
            <li>
              <span className="font-semibold text-navy-900">For social posts:</span>{" "}
              &ldquo;#ad&rdquo; or &ldquo;Affiliate link &mdash; I may earn a
              small commission if you sign up.&rdquo;
            </li>
            <li>
              <span className="font-semibold text-navy-900">For text messages
              to friends:</span> &ldquo;Heads up &mdash; this is an affiliate
              link, so I get a small cut if you sign up. Same price for you
              either way.&rdquo;
            </li>
            <li>
              <span className="font-semibold text-navy-900">For blog posts
              and email newsletters:</span> &ldquo;This post contains affiliate
              links. If you purchase through them, I may earn a commission at
              no additional cost to you.&rdquo;
            </li>
            <li>
              <span className="font-semibold text-navy-900">For YouTube /
              Reels / TikTok captions:</span> &ldquo;Affiliate links in
              caption / description.&rdquo;
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">What members may not do</h2>
          <p className="mt-4">
            Our{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            require members to follow all applicable laws and the FTC&apos;s
            endorsement rules. Specifically, members may not:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Omit the required affiliate disclosure on a paid recommendation.</li>
            <li>
              Misrepresent themselves as employees, owners, or official
              spokespeople of a brand they promote.
            </li>
            <li>Make false earnings or income claims about MomFluence.</li>
            <li>
              Make medical, financial, or legal claims about a product
              that exceed what the brand itself officially claims.
            </li>
            <li>
              Use deceptive headlines, fake screenshots, or fabricated
              testimonials.
            </li>
            <li>
              Engage in cookie stuffing, link cloaking that hides
              affiliate-link nature, or any other technique that violates
              FTC rules or our brand partners&apos; terms.
            </li>
          </ul>
          <p className="mt-4">
            Members who repeatedly violate these rules will have their
            membership terminated and may forfeit unpaid commissions per our
            Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-navy-900">Questions</h2>
          <p className="mt-4">
            For questions about this disclosure, our brand relationships, or
            FTC compliance, email{" "}
            <a href="mailto:hello@momfluence.app" className="underline">
              hello@momfluence.app
            </a>
            . For the official FTC guidance on disclosing affiliate
            relationships, see the FTC&apos;s{" "}
            <a
              href="https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers"
              target="_blank"
              rel="noreferrer noopener"
              className="underline"
            >
              Disclosures 101 for Social Media Influencers
            </a>
            .
          </p>
        </section>

        <p className="text-sm text-navy-500">
          See also:{" "}
          <Link href="/disclosures/earnings" className="underline">
            Earnings Disclaimer
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
