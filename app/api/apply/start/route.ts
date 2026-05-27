import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { toStripeMetadata, type Attribution } from "@/lib/funnel-lab/attribution";

/**
 * Anonymous apply endpoint — the FAST-PATH primary signup flow (added 2026-05-27).
 *
 * Unlike /api/checkout/create (which requires an authenticated Supabase user
 * from the OAuth/email-password flow), this endpoint accepts an UN-authenticated
 * request, creates a Stripe Checkout Session, and lets Stripe collect the
 * applicant's email. Account creation happens AFTER payment via the webhook
 * handler in app/api/stripe/webhook/route.ts.
 *
 * Why this exists:
 *   The current OAuth signup path is broken (PKCE flow with custom auth domain
 *   never delivers the auth_code back to /auth/callback — see Supabase
 *   auth.flow_state forensics from 2026-05-27). Rather than fix the OAuth bug
 *   first, the strategic decision is to route the primary funnel around OAuth
 *   entirely. Apple Pay / Google Pay / card on the Stripe-hosted page covers
 *   99% of conversion intent without touching the broken PKCE path.
 *
 * Flow:
 *   1. /signup hero renders a single "Apply with Apple Pay or Google Pay — $5"
 *      button
 *   2. Click → POST here → returns Stripe Checkout URL → window.location
 *   3. Stripe page shows Apple Pay (Safari/iOS) + Google Pay (Chrome) at top,
 *      Link wallet, then card form. Email collected by Stripe.
 *   4. User pays → Stripe redirects to /signup/success?session_id=...
 *   5. Webhook (checkout.session.completed) creates the auth.users row +
 *      upserts momfluencers row with payment data
 *   6. /signup/success client component calls supabase.auth.signInWithOtp({email})
 *      → magic-link email sent (via Supabase's built-in SMTP, NOT the broken
 *      OAuth path)
 *   7. User clicks magic link → /onboarding → fills in application details
 *      → /dashboard
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const APPLICATION_FEE_CENTS = 500; // $5.00 USD

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error("[/api/apply/start] env-missing STRIPE_SECRET_KEY");
    return NextResponse.json(
      { error: "Checkout is not configured. Please try again shortly." },
      { status: 503 }
    );
  }

  // Best-effort parse of attribution. Body is optional.
  let attribution: Attribution = {};
  try {
    const body = await req.json();
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
    // No body or bad JSON — proceed with empty attribution.
  }

  const stripe = new Stripe(secret.trim(), {
    maxNetworkRetries: 0,
    timeout: 15000,
  });

  const attrMeta = toStripeMetadata(attribution);
  const sessionMeta = { source: "apply_anonymous", ...attrMeta };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: APPLICATION_FEE_CENTS,
            product_data: {
              name: "MomFluence — Apply to Join",
              description:
                "Refundable deposit. If approved, $5/mo membership begins. If not approved, full refund.",
            },
          },
          quantity: 1,
        },
      ],
      // Always create a Stripe Customer so we have a Customer ID before
      // auth.users exists. The webhook uses customer_details.email to
      // create the Supabase user post-payment.
      customer_creation: "always",
      // Stripe automatically renders Apple Pay (Safari/iOS) and Google Pay
      // (Chrome) at the top of the page, plus Link wallet and card form below.
      // No payment_method_types configured — let Stripe show every method
      // available to the user's browser/device.
      success_url:
        "https://momfluence.app/signup/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://momfluence.app/signup?cancelled=1",
      allow_promotion_codes: true,
      metadata: sessionMeta,
      payment_intent_data: { metadata: sessionMeta },
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
    console.error("[/api/apply/start] error:", e.message);
    return NextResponse.json(
      { error: e.message || "Could not start application checkout." },
      { status: 500 }
    );
  }
}
