import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-navy-100 bg-white mt-24">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <p className="text-lg font-display font-bold text-navy-900">MomFluence</p>
          <p className="mt-2 text-sm text-navy-600">
            Curated brand partnerships for Moms. Share links. Get paid.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-800 uppercase tracking-wide">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/how-it-works" className="text-navy-600 hover:text-navy-900 no-underline">How it works</Link></li>
            <li><Link href="/for-influencers" className="text-navy-600 hover:text-navy-900 no-underline">For moms</Link></li>
            <li><Link href="/pricing" className="text-navy-600 hover:text-navy-900 no-underline">Pricing</Link></li>
            <li><Link href="/login" className="text-navy-600 hover:text-navy-900 no-underline">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-800 uppercase tracking-wide">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/privacy" className="text-navy-600 hover:text-navy-900 no-underline">Privacy</Link></li>
            <li><Link href="/terms" className="text-navy-600 hover:text-navy-900 no-underline">Terms</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-800 uppercase tracking-wide">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="mailto:hello@momfluence.app" className="text-navy-600 hover:text-navy-900 no-underline">hello@momfluence.app</a></li>
            <li><a href="https://www.facebook.com/momfluence.app" target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:text-navy-900 no-underline">Facebook</a></li>
            <li><a href="https://www.instagram.com/momfluence.app" target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:text-navy-900 no-underline">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-100">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-navy-500">
          <p>&copy; {new Date().getFullYear()} MomFluence. All rights reserved.</p>
          <p>Earnings vary based on traffic and engagement. Not a guaranteed-income program.</p>
        </div>
      </div>
    </footer>
  );
}
