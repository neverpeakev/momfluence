import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-bold text-navy-900">MomFluence</p>
            <p className="mt-3 text-sm text-navy-600">
              Get paid for the stuff you&apos;re already sharing.
            </p>
            <p className="mt-3 text-sm text-navy-500">MomFluence.app</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-500">
              Product
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="text-navy-700 no-underline hover:text-navy-900">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-navy-700 no-underline hover:text-navy-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/for-influencers#faq"
                  className="text-navy-700 no-underline hover:text-navy-900"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-navy-700 no-underline hover:text-navy-900">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-500">
              Company
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-navy-700 no-underline hover:text-navy-900">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-navy-700 no-underline hover:text-navy-900">
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/disclosures/affiliate-marketing"
                  className="text-navy-700 no-underline hover:text-navy-900"
                >
                  Affiliate disclosure
                </Link>
              </li>
              <li>
                <Link
                  href="/disclosures/earnings"
                  className="text-navy-700 no-underline hover:text-navy-900"
                >
                  Earnings disclaimer
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@momfluence.app"
                  className="text-navy-700 no-underline hover:text-navy-900"
                >
                  Contact: hello@momfluence.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-navy-100 pt-6 flex flex-col gap-2 text-xs text-navy-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Never Peak Inc. · Made for moms with friends.</p>
          <p>Affiliate links may earn commissions for our members.</p>
        </div>
      </div>
    </footer>
  );
}
