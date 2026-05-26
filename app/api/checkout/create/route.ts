import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { toStripeMetadata, type Attribution } from "@/lib/funnel-lab/attribution";
import { fireServerSideCompleteRegistration } from "@/lib/meta-capi";

/**
 * Apply-for-a-spot checkout (2026-05-25 pivot).
 *
 * Previously: mode='subscription', $5/mo recurring via STRIPE_PRICE_ID_MEMBERSHIP.
 * Now: mode='payment', one-time $5 application fee via inline price_data
 * (no env var needed — Stripe creates the Price on the fly).
 *
 * Why one-time over subscription:
 *   1. "Refundable deposit" framing requires a single charge, not recurring
 *   2. Eliminates month-2 churn risk on a positioning that promised refund
 *   3. Lets the user feel they've paid once and earned permanent access
 *   4. Stripe still creates Customer + Charge — webhook handler unchanged
 *
 * Existing $5/mo subscribers (Kelly, kevin+test5) are unaffected — their
 * Stripe subscriptions continue independently. Only NEW signups go through
 * this one-time path.
 *
 * Application fields (instagram_handle, tiktok_handle, why, geo) are saved
 * to the momfluencer row before the Stripe redirect so we have them for
 * the auto-review step. Status stays 'pending' until checkout.session.
 * completed webhook flips it to 'approved'.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

interface ApplicationFields {
  instagram_handle: string | null;
  tiktok_handle: string | null;
  why: string;
  geo: "us" | "ca" | "other";
}

const APPLICATION_FEE_CENTS = 500; // $5.00 USD

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;

  // Best-effort parse — body is optional. If parsing fails, we just send no attribution.
  let attribution: Attribution = {};
  let application: ApplicationFields | null = null;
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
    if (body?.application && typeof body.application === "object") {
      const ap = body.application as Record<string, unknown>;
      const handleLike = (v: unknown): string | null =>
        typeof v === "string" && v.length > 0 && v.length <= 60 && /^[a-z0-9._-]+$/i.test(v) ? v : null;
      const geoLike = (v: unknown): "us" | "ca" | "other" =>
        v === "us" || v === "ca" || v === "other" ? v : "other";
      const whyClean = typeof ap.why === "string" ? ap.why.trim().slice(0, 1000) : "";
      application = {
        instagram_handle: handleLike(ap.instagram_handle),
        tiktok_handle: handleLike(ap.tiktok_handle),
        why: whyClean,
        geo: geoLike(ap.geo),
      };
    }
  } catch {
    // ignore — no body, attribution stays empty
  }

  if (!secret) {
    console.error("[/api/checkout/create] env-missing STRIPE_SECRET_KEY");
    return NextResponse.json(
      { error: "Checkout is not configured. Please try again shortly." },
      { status: 503 }
    );
  }

  // Defense-in-depth: strip any whitespace/newlines from env var paste artifacts.
  const cleanSecret = secret.trim();

  // Diagnostic-only fingerprint of the secret (never log the secret itself).
  const secretPrefix = cleanSecret.slice(0, 7); // e.g. "sk_live" or "sk_test"
  const secretLen = secret.length;
  const secretTrimmedLen = cleanSecret.length;
  const secretWasModified = secret !== cleanSecret;
  const secretContainsNewline = secret.includes("\n");
  const secretContainsSpace = / /.test(secret);
  const secretContainsCR = secret.includes("\r");
  const secretSkLiveCount = (secret.match(/sk_live_/g) || []).length;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Save application fields to the momfluencer row before redirecting to
  // Stripe. The row already exists (created by the auth.users insert trigger)
  // — we just enrich it with the application data so the reviewer step has
  // what it needs when checkout.session.completed fires the webhook.
  if (application) {
    const { error: updateErr } = await supabase
      .from("momfluencers")
      .update({
        instagram_handle: application.instagram_handle,
        tiktok_handle: application.tiktok_handle,
        notes_internal: JSON.stringify({
          application_why: application.why,
          application_geo: application.geo,
          application_submitted_at: new Date().toISOString(),
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateErr) {
      // Non-fatal — checkout can still proceed without the application fields
      // saved, but log so we notice if the pattern persists.
      console.error("[/api/checkout/create] application save failed:", updateErr.message);
    }
  }

  // Fire Meta CAPI CompleteRegistration server-side, in parallel with the
  // browser pixel firing the same event from /signup or /signup/complete.
  // Meta dedupes by event_id = `complete_registration_${user.id}` (matches
  // lib/meta-pixel.ts fireMetaCompleteRegistration's canonical id).
  //
  // Fire-and-forget: do NOT await. The Stripe checkout creation must not be
  // delayed by Meta's RTT, and a CAPI failure must never block the user from
  // hitting Stripe. The CAPI helper swallows errors internally and logs to
  // Vercel — see lib/meta-capi.ts.
  //
  // Source URL guess: this endpoint is called from both /signup and
  // /signup/complete. We default to /signup since it's the more common path,
  // accepting a tiny attribution mismatch in Meta Events Manager for the
  // OAuth completion case. The browser pixel fires with the actual page URL
  // and Meta dedupes via event_id anyway, so the source URL only affects
  // the analytics breakdown by URL.
  if (user.email) {
    void fireServerSideCompleteRegistration({
      authUserId: user.id,
      email: user.email,
      eventSourceUrl: "https://momfluence.app/signup",
      clientIpAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      clientUserAgent: req.headers.get("user-agent") || undefined,
    });
  }

  // Disable retries so the underlying error surfaces on the first failure.
  const stripe = new Stripe(cleanSecret, {
    maxNetworkRetries: 0,
    timeout: 15000
  });

  // Fold funnel-lab attribution into Stripe metadata so /admin/funnel-lab can aggregate
  // signup/Purchase events by variant + creative without a Supabase schema change.
  const attrMeta = toStripeMetadata(attribution);
  const sessionMeta = { auth_user_id: user.id, ...attrMeta };

  try {
    const session = await stripe.checkout.sessions.create({
      // One-time application fee, not a subscription. This is the core of
      // the apply-for-a-spot pivot — see file docblock for rationale.
      mode: "payment",
      line_items: [
        {
          // Inline price_data — no need to pre-create a Stripe Product/Price.
          // Stripe creates them on the fly. The product_data.name + description
          // is what Stripe renders at the top of the Checkout page, so it's
          // the LAST piece of copy the user reads before paying. Critical.
          price_data: {
            currency: "usd",
            unit_amount: APPLICATION_FEE_CENTS,
            product_data: {
              name: "MomFluence Affiliate Application — $5",
              description:
                "Refundable deposit. Credited to your first payout if accepted, fully refunded if not. Decision in under 24 hours.",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      // Send the user to the review screen first (psychological "we're
      // reviewing your application" wait) — that page redirects to /welcome
      // once the auto-review completes.
      success_url: "https://momfluence.app/application-status?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://momfluence.app/?cancelled=true",
      allow_promotion_codes: true,
      // Payment-mode sessions need payment_intent_data for metadata to land
      // on the resulting PaymentIntent (subscription_data isn't applicable).
      payment_intent_data: {
        metadata: sessionMeta,
      },
      metadata: sessionMeta,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const e = err as {
      message?: string;
      type?: string;
      code?: string;
      statusCode?: number;
      requestId?: string;
      raw?: { message?: string; code?: string; type?: string };
      cause?: {
        message?: string;
        code?: string;
        errno?: number;
        syscall?: string;
        hostname?: string;
        name?: string;
      };
    };

    const diag = {
      message: e.message,
      type: e.type,
      code: e.code,
      statusCode: e.statusCode,
      requestId: e.requestId,
      rawMessage: e.raw?.message,
      rawCode: e.raw?.code,
      rawType: e.raw?.type,
      causeName: e.cause?.name,
      causeMessage: e.cause?.message,
      causeCode: e.cause?.code,
      causeErrno: e.cause?.errno,
      causeSyscall: e.cause?.syscall,
      causeHostname: e.cause?.hostname,
      secretPrefix,
      secretLen,
      secretTrimmedLen,
      secretWasModified,
      secretContainsNewline,
      secretContainsSpace,
      secretContainsCR,
      secretSkLiveCount,
    };

    // Multi-line console output — short lines avoid log-viewer truncation.
    console.error("[checkout-debug] message:", diag.message);
    console.error("[checkout-debug] type:", diag.type);
    console.error("[checkout-debug] code:", diag.code);
    console.error("[checkout-debug] statusCode:", diag.statusCode);
    console.error("[checkout-debug] causeName:", diag.causeName);
    console.error("[checkout-debug] causeMessage:", diag.causeMessage);
    console.error("[checkout-debug] causeCode:", diag.causeCode);
    console.error("[checkout-debug] causeErrno:", diag.causeErrno);
    console.error("[checkout-debug] causeSyscall:", diag.causeSyscall);
    console.error("[checkout-debug] causeHostname:", diag.causeHostname);
    console.error("[checkout-debug] secretPrefix:", diag.secretPrefix);
    console.error("[checkout-debug] secretLen:", diag.secretLen);

    return NextResponse.json(
      { error: e.message || "Checkout creation failed.", diagnostic: diag },
      { status: 500 }
    );
  }
}
