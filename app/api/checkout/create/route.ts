import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_MEMBERSHIP;

  if (!secret || !priceId) {
    console.error("[/api/checkout/create] env-missing", {
      hasSecret: Boolean(secret),
      hasPriceId: Boolean(priceId)
    });
    return NextResponse.json(
      { error: "Checkout is not configured. Please try again shortly." },
      { status: 503 }
    );
  }

  // Diagnostic-only fingerprint of the secret (never log the secret itself).
  const secretPrefix = secret.slice(0, 7); // e.g. "sk_live" or "sk_test"
  const secretLen = secret.length;
  const priceIdTrimmedSame = priceId === priceId.trim();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Disable retries so the underlying error surfaces on the first failure.
  const stripe = new Stripe(secret, {
    maxNetworkRetries: 0,
    timeout: 15000
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      success_url: "https://momfluence.app/welcome?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://momfluence.app/?cancelled=true",
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { auth_user_id: user.id }
      },
      metadata: { auth_user_id: user.id }
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
      priceId,
      priceIdTrimmedSame
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
    console.error("[checkout-debug] priceIdTrimmedSame:", diag.priceIdTrimmedSame);

    return NextResponse.json(
      { error: e.message || "Checkout creation failed.", diagnostic: diag },
      { status: 500 }
    );
  }
}
