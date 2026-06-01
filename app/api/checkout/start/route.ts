import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { toStripeMetadata, type Attribution } from "@/lib/funnel-lab/attribution";

/**
 * THE membership checkout endpoint (2026-05-31 funnel rebuild).
 *
 * One clean anonymous path: visitor taps a wallet/card button on the homepage
 * or /signup → POST here → Stripe Checkout (mode=subscription, $5/mo) → pay →
 * webhook creates the Supabase account from the email Stripe collected →
 * /signup/success sends a magic link → /welcome → /dashboard.
 *
 * No account before payment, no password, no OAuth, no application/review.
 *
 * Replaces the two prior endpoints this rebuild deleted:
 *   - /api/apply/start   (anonymous, one-time $5 "application fee")
 *   - /api/checkout/create (authenticated, one-time $5)
 *
 * Apple Pay + Google Pay + Link + card all render automatically on Stripe's
 * hosted page — no payment_method_types config needed. Apple Pay works without
 * a domain-registration step because the wallet renders on Stripe's own domain.
 *
 * Requires STRIPE_PRICE_ID_MEMBERSHIP — a recurring $5/mo Price created in the
 * Stripe dashboard. Without it we 503 with a friendly message rather than
 * silently falling back.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  // Optional: a pre-made $5/mo Price in the Stripe dashboard. If unset we build
  // the recurring price inline below, so the funnel works the moment it deploys
  // with zero Stripe-dashboard setup. Set the env var later for tidier Stripe
  // objects (one canonical Price instead of ad-hoc ones).
  const priceId = process.env.STRIPE_PRICE_ID_MEMBERSHIP?.trim();

  if (!secret) {
    console.error("[/api/checkout/start] env-missing STRIPE_SECRET_KEY");
    return NextResponse.json(
      { error: "Checkout is not configured yet. Please try again shortly." },
      { status: 503 }
    );
  }

  // Best-effort parse of funnel attribution. Body is optional.
  // body.embedded=true switches to Stripe Embedded Checkout (ui_mode='embedded'):
  // the payment form mounts inside our own /checkout page (same domain, pixel
  // fires there) instead of redirecting to Stripe's hosted page. Default stays
  // hosted so the existing homepage/​signup buttons are untouched.
  let attribution: Attribution = {};
  let embedded = false;
  try {
    const body = await req.json();
    if (body?.embedded === true) embedded = true;
    if (body?.attribution && typeof body.attribution === "object") {
      const a = body.attribution as Record<string, unknown>;
      const slugLike = (v: unknown): string | undefined =>
        typeof v === "string" && /^[a-z0-9-]{1,40}$/.test(v) ? v : undefined;
      const isoLike = (v: unknown): string | undefined =>
        typeof v === "string" && v.length <= 32 && !Number.isNaN(Date.parse(v)) ? v : undefined;
      const pricingLike = (v: unknown): "B" | "C" | undefined =>
        v === "B" || v === "C" ? v : undefined;
      attribution = {
        variant: slugLike(a.variant),
        creative: slugLike(a.creative),
        firstSeen: isoLike(a.firstSeen),
        pricingVariant: pricingLike(a.pricingVariant),
      };
    }
  } catch {
    // No body or bad JSON — proceed with empty attribution, hosted mode.
  }

  const stripe = new Stripe(secret.trim(), {
    maxNetworkRetries: 0,
    timeout: 15000,
  });

  // source=membership lets the Stripe webhook (checkout.session.completed)
  // recognize this as the anonymous subscription flow and create the auth user
  // from customer_details.email post-payment.
  const sessionMeta = { source: "membership", ...toStripeMetadata(attribution) };

  // Use the canonical Price if configured; otherwise build the $5/mo recurring
  // price inline so checkout works without any dashboard setup. Inlined (no
  // named type) because stripe-node's namespaced SessionCreateParams type isn't
  // exported in this version.
  const lineItems = [
    priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 500,
            recurring: { interval: "month" as const },
            product_data: { name: "MomFluence Membership" },
          },
        },
  ];

  // The method's own param type — avoids depending on the namespaced
  // Stripe.Checkout.SessionCreateParams type, which isn't exported in this
  // stripe-node version (same reason line_items is inlined above).
  type CreateParams = Parameters<typeof stripe.checkout.sessions.create>[0];

  try {
    if (embedded) {
      // Embedded Checkout: Stripe's UI mounts inside /checkout on our domain.
      // return_url (not success/cancel) is where Stripe sends the browser after
      // completion; same /signup/success target so the rest of the funnel
      // (magic link → /welcome → Purchase pixel) is unchanged.
      const embeddedParams = {
        ui_mode: "embedded",
        mode: "subscription",
        line_items: lineItems,
        return_url:
          "https://momfluence.app/signup/success?session_id={CHECKOUT_SESSION_ID}",
        allow_promotion_codes: true,
        metadata: sessionMeta,
        subscription_data: { metadata: sessionMeta },
      } as CreateParams;
      const session = await stripe.checkout.sessions.create(embeddedParams);

      if (!session.client_secret) {
        return NextResponse.json(
          { error: "Stripe did not return a client secret" },
          { status: 500 }
        );
      }
      return NextResponse.json({ clientSecret: session.client_secret });
    }

    // Hosted Checkout (default) — unchanged behavior for existing buttons.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: lineItems,
      success_url:
        "https://momfluence.app/signup/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://momfluence.app/?cancelled=1",
      allow_promotion_codes: true,
      metadata: sessionMeta,
      subscription_data: { metadata: sessionMeta },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[/api/checkout/start] error:", e.message);
    return NextResponse.json(
      { error: e.message || "Could not start checkout." },
      { status: 500 }
    );
  }
}
