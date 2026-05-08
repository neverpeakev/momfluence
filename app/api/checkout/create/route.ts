import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_MEMBERSHIP;

  if (!secret || !priceId) {
    return NextResponse.json(
      { error: "Checkout is not configured. Please try again shortly." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stripe = new Stripe(secret);

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
    const message = err instanceof Error ? err.message : "Checkout creation failed.";
    console.error("[/api/checkout/create]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
