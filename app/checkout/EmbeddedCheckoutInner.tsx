"use client";

/**
 * Stripe Embedded Checkout mounted on OUR domain (momfluence.app/checkout).
 *
 * Unlike the hosted flow (which redirects to checkout.momfluence.app — a
 * Stripe-served page with no pixel), this keeps the whole payment step on a
 * page we control: our pixel, PageView, and InitiateCheckout all fire here,
 * and the Meta Pixel Helper sees the pixel. The card fields themselves are
 * Stripe iframes (PCI-safe) embedded in our page.
 *
 * Flow: mount → POST /api/checkout/start { embedded: true } → get clientSecret
 * → render <EmbeddedCheckout>. On completion Stripe redirects to the session's
 * return_url (/signup/success), so the rest of the funnel (magic link →
 * /welcome → Purchase pixel) is identical to the hosted flow.
 *
 * Requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. If it's missing we show a clear
 * message and a link back to the working hosted flow rather than a blank box.
 */

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import {
  parseAttributionFromQuery,
  readAttributionFromCookies,
  writeAttributionToCookies,
  type Attribution,
} from "@/lib/funnel-lab/attribution";
import { fireMetaAddToCart, fireMetaInitiateCheckout } from "@/lib/meta-pixel";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// loadStripe is safe to call at module scope; returns null if the key is unset.
const stripePromise = pk ? loadStripe(pk) : null;

export default function EmbeddedCheckoutInner() {
  const sp = useSearchParams();

  // Build the clientSecret fetcher Stripe calls. We merge attribution the same
  // way the homepage button does, persist it, and fire the funnel events on the
  // way in so this page is a real, tracked funnel step.
  const fetchClientSecret = useCallback(async () => {
    const fromUrl: Attribution = sp ? parseAttributionFromQuery(sp) : {};
    const fromCookie = readAttributionFromCookies();
    const attr: Attribution = {
      variant: fromUrl.variant ?? fromCookie.variant,
      creative: fromUrl.creative ?? fromCookie.creative,
      firstSeen: fromCookie.firstSeen ?? new Date().toISOString(),
      pricingVariant: fromUrl.pricingVariant ?? fromCookie.pricingVariant,
    };
    writeAttributionToCookies(attr);

    const res = await fetch("/api/checkout/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embedded: true, attribution: attr }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Could not start checkout (${res.status})`);
    }
    const { clientSecret } = await res.json();
    if (!clientSecret) throw new Error("Checkout client secret missing");
    return clientSecret as string;
  }, [sp]);

  // Reaching this page = high checkout intent. Fire AddToCart + InitiateCheckout
  // here (on OUR domain) so the pixel registers the step and Meta gets the
  // mid-funnel signal — the thing the Stripe-hosted page couldn't do.
  useEffect(() => {
    fireMetaAddToCart();
    fireMetaInitiateCheckout();
  }, []);

  if (!stripePromise) {
    return (
      <div className="rounded-xl bg-coral-50 px-4 py-4 text-sm text-navy-800 ring-1 ring-coral-200">
        <p className="font-semibold text-coral-700">Checkout isn&apos;t configured yet.</p>
        <p className="mt-1">
          The embedded payment form needs a Stripe publishable key. In the
          meantime you can{" "}
          <Link href="/signup" className="text-coral-700 underline">
            join via our standard checkout
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div id="embedded-checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
