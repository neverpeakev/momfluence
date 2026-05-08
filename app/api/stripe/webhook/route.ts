import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STRIPE_TO_MEMBERSHIP: Record<string, string> = {
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "past_due",
  incomplete: "inactive",
  incomplete_expired: "canceled",
  trialing: "trialing",
  paused: "inactive"
};

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const signingSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

  if (!secret || !signingSecret) {
    console.error("[stripe webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SIGNING_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, signingSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const authUserId =
          session.client_reference_id ||
          (session.metadata?.auth_user_id as string | undefined);

        if (!authUserId) {
          console.error(
            "[stripe webhook] checkout.session.completed missing auth_user_id",
            session.id
          );
          break;
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        // Resolve the auth user's email so we can satisfy momfluencers.email NOT NULL.
        const { data: userResp } = await supabase.auth.admin.getUserById(authUserId);
        const email = userResp?.user?.email ?? session.customer_email ?? null;

        if (!email) {
          console.error(
            "[stripe webhook] checkout.session.completed could not resolve email",
            { authUserId, sessionId: session.id }
          );
          break;
        }

        // v2 is single-sided — no manual application review, set status='approved' on first payment.
        const { error } = await supabase
          .from("momfluencers")
          .upsert(
            {
              id: authUserId,
              email,
              status: "approved",
              membership_status: "active",
              stripe_customer_id: customerId,
              approved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            { onConflict: "id" }
          );

        if (error) {
          console.error("[stripe webhook] failed to upsert momfluencer:", error.message);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const membershipStatus = STRIPE_TO_MEMBERSHIP[sub.status] ?? "inactive";

        const { error } = await supabase
          .from("momfluencers")
          .update({
            membership_status: membershipStatus,
            updated_at: new Date().toISOString()
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("[stripe webhook] subscription.updated update failed:", error.message);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        const { error } = await supabase
          .from("momfluencers")
          .update({
            membership_status: "canceled",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("[stripe webhook] subscription.deleted update failed:", error.message);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        if (customerId) {
          const { error } = await supabase
            .from("momfluencers")
            .update({
              membership_status: "past_due",
              updated_at: new Date().toISOString()
            })
            .eq("stripe_customer_id", customerId);

          if (error) {
            console.error(
              "[stripe webhook] invoice.payment_failed update failed:",
              error.message
            );
          }
        }
        break;
      }

      default:
        // Other events are intentionally ignored.
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    console.error("[stripe webhook] handler error:", message);
    // Return 500 so Stripe retries (only for unexpected errors, not signature failures).
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
