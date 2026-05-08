import { NextResponse } from "next/server";
import { getStripe, STRIPE_PRICE_ID_MEMBERSHIP } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://momfluence.app";

export async function POST(req: Request) {
  try {
    const stripe = getStripe();

    let customerEmail: string | undefined;
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        customerEmail = data.user.email ?? undefined;
        userId = data.user.id;
      }
    } catch {
      // unauthenticated checkout is fine — Stripe will collect email
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID_MEMBERSHIP, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_email: customerEmail,
      client_reference_id: userId,
      metadata: userId ? { user_id: userId } : undefined,
      success_url: `${SITE}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/?cancelled=true`,
      subscription_data: {
        metadata: userId ? { user_id: userId } : undefined,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url, id: session.id }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout/create] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
