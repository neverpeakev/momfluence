import { Suspense } from "react";
import EmbeddedCheckoutInner from "./EmbeddedCheckoutInner";

/**
 * /checkout — single-domain membership checkout (Stripe Embedded Checkout).
 *
 * The payment form lives on momfluence.app itself, so the Meta pixel (loaded
 * globally in the root layout) fires PageView here and the whole funnel can be
 * watched on one domain with no redirect to a Stripe-hosted page. On completion
 * Stripe redirects to /signup/success (same as the hosted flow).
 *
 * The homepage/​signup wallet buttons still use the hosted flow until we cut
 * them over; this page is the new on-domain path.
 */

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10 sm:py-14">
      <h1 className="text-3xl text-navy-900 leading-tight sm:text-4xl">
        Join MomFluence — $5/mo
      </h1>
      <p className="mt-2 text-sm text-navy-600">
        Cancel anytime. Your curated affiliate links are live the moment you join.
      </p>

      <div className="mt-8">
        <Suspense
          fallback={
            <p className="text-sm text-navy-500">Loading secure checkout…</p>
          }
        >
          <EmbeddedCheckoutInner />
        </Suspense>
      </div>
    </main>
  );
}
