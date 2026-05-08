import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import MarketingShell from "@/components/MarketingShell";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Welcome to MomFluence",
  description: "Your MomFluence membership is active.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ session_id?: string }>;

function isPaidSession(session: Stripe.Checkout.Session): boolean {
  if (session.status !== "complete") return false;
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return false;
  if (session.amount_total == null) return false;
  return true;
}

export default async function WelcomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sessionId = params.session_id;
  if (!sessionId) redirect("/");

  let session: Stripe.Checkout.Session | null = null;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[welcome] could not retrieve session:", err);
  }

  const firePurchase = !!session && isPaidSession(session);
  const valueUsd = session?.amount_total != null ? session.amount_total / 100 : 5.0;
  const currency = (session?.currency || "usd").toUpperCase();
  // Stable event_id keyed off session id so Meta dedupes across browser+CAPIG and across page reloads.
  const eventId = sessionId ? `purchase-${sessionId}` : null;

  return (
    <MarketingShell>
      <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 text-center">
        <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">Welcome</p>
        <h1 className="mt-3 text-4xl sm:text-5xl text-navy-900 leading-tight">
          You're in. Let's get you earning.
        </h1>
        <p className="mt-6 text-lg text-navy-600">
          Your MomFluence membership is active. We just emailed your receipt — check your inbox.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="btn-primary no-underline">Go to dashboard</Link>
          <Link href="/catalog" className="btn-ghost no-underline">Browse the catalog</Link>
        </div>

        <div className="mt-12 card text-left">
          <h2 className="text-xl text-navy-900">Next steps</h2>
          <ol className="mt-4 list-decimal pl-5 space-y-2 text-navy-700 text-sm">
            <li>Complete your profile (handles + bio).</li>
            <li>Connect your payout destination via Stripe Connect Express. NET-30 direct deposit.</li>
            <li>Browse the catalog and grab a tracked link for your first offer.</li>
            <li>Drop the link in a caption, story, or DM. Track conversions in real time.</li>
          </ol>
        </div>

        {firePurchase && eventId && (
          <Script id="meta-purchase" strategy="afterInteractive">{`
            (function() {
              if (!window.fbq) return;
              try {
                var key = 'mf_purchase_fired_' + ${JSON.stringify(eventId)};
                if (window.sessionStorage && sessionStorage.getItem(key)) return;
                fbq('trackSingle', '1468831514190648', 'Purchase', {
                  value: ${JSON.stringify(valueUsd)},
                  currency: ${JSON.stringify(currency)},
                  content_type: 'product',
                  content_name: 'MomFluence Membership',
                  content_category: 'Subscription'
                }, { eventID: ${JSON.stringify(eventId)} });
                if (window.sessionStorage) sessionStorage.setItem(key, '1');
              } catch (e) { /* swallow */ }
            })();
          `}</Script>
        )}
      </main>
    </MarketingShell>
  );
}
