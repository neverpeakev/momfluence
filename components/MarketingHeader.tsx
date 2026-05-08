import Link from "next/link";

export default function MarketingHeader() {
  return (
    <header className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-xl font-display font-bold text-navy-900 no-underline">
          MomFluence
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/how-it-works" className="px-3 py-2 rounded-lg text-sm text-navy-700 hover:bg-navy-50 no-underline">
            How it works
          </Link>
          <Link href="/for-influencers" className="px-3 py-2 rounded-lg text-sm text-navy-700 hover:bg-navy-50 no-underline">
            For moms
          </Link>
          <Link href="/pricing" className="px-3 py-2 rounded-lg text-sm text-navy-700 hover:bg-navy-50 no-underline">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-navy-600 hover:text-navy-900 no-underline">
            Sign in
          </Link>
          <Link href="/pricing" className="btn-primary text-sm py-2 px-4 no-underline">
            Join $5/mo
          </Link>
        </div>
      </div>
    </header>
  );
}
