import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function syncSubscription(sub: Stripe.Subscription, customerId: string | null) {
  if (!customerId) return;
  let membershipStatus: string;
  switch (sub.status) {
    case "active":
    case "trialing":
      membershipStatus = sub.status;
      break;
    case "past_due":
    case "unpaid":
      membershipStatus = "past_due";
      break;
    case "canceled":
    case "incomplete_expired":
      membershipStatus = "canceled";
      break;
    case "incomplete":
    case "paused":
    default:
      membershipStatus = "inactive";
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("momfluencers")
    .update({ membership_status: membershipStatus })
    .eq("stripe_customer_id", customerId);
  if (error) console.error("[stripe/webhook] supabase update failed:", error.message);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] missing STRIPE_WEBHOOK_SIGNING_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe/webhook] signature verify failed:", message);
    return NextResponse.json({ error: `Invalid signature: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const userId = session.client_reference_id || (session.metadata?.user_id ?? null);
        const email = session.customer_details?.email || session.customer_email || null;

        if (customerId) {
          const supabase = createServiceRoleClient();
          if (userId) {
            await supabase
              .from("momfluencers")
              .update({ stripe_customer_id: customerId, membership_status: "active" })
              .eq("id", userId);
          } else if (email) {
            await supabase
              .from("momfluencers")
              .update({ stripe_customer_id: customerId, membership_status: "active" })
              .eq("email", email);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
        await syncSubscription(sub, customerId);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null;
        if (customerId) {
          const supabase = createServiceRoleClient();
          await supabase
            .from("momfluencers")
            .update({ membership_status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] handler error:", message, "event:", event.type);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
