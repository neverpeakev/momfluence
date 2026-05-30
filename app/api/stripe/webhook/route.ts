import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  fireServerSideCompleteRegistration,
  fireServerSidePurchase,
} from "@/lib/meta-capi";

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

        // Two flows write through this handler:
        //  A. Authenticated apply flow (legacy /api/checkout/create):
        //     client_reference_id = auth_user_id (set by SignupInner /
        //     CompleteInner before redirect to Stripe)
        //  B. Anonymous apply flow (NEW /api/apply/start, 2026-05-27):
        //     metadata.source = "apply_anonymous", no client_reference_id.
        //     Create the auth.users row here from session.customer_details.email
        //     before upserting momfluencers.
        const isAnonymousApply = session.metadata?.source === "apply_anonymous";

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        let authUserId: string | undefined =
          session.client_reference_id ||
          (session.metadata?.auth_user_id as string | undefined) ||
          undefined;
        let email: string | null = null;

        if (isAnonymousApply) {
          // Stripe's customer_details.email is populated when customer_creation='always'
          // and Stripe collected the email at the top of the checkout page.
          email =
            session.customer_details?.email ??
            session.customer_email ??
            null;

          if (!email) {
            console.error(
              "[stripe webhook] apply_anonymous missing email on session",
              session.id
            );
            break;
          }

          // Create-or-find the Supabase auth user for this email.
          // admin.createUser with email_confirm=true marks the email as
          // verified (the payment IS the verification — Stripe just charged
          // them) AND skips Supabase's signup-confirmation email so the user
          // only gets ONE email: the magic-link sent from /signup/success.
          //
          // If the user already exists, createUser errors with status 422
          // ("A user with this email address has already been registered").
          // In that case, look them up via listUsers.
          const createRes = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { source: "apply_anonymous" },
          });

          if (createRes.error) {
            // Most likely: user already exists from a prior signup attempt.
            // Look them up so we can still link the Stripe Customer + payment.
            const errMsg = createRes.error.message.toLowerCase();
            const alreadyExists =
              errMsg.includes("already") ||
              errMsg.includes("registered") ||
              errMsg.includes("exists");
            if (alreadyExists) {
              // listUsers doesn't support email filter directly — fetch and filter.
              const { data: list } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
              });
              const existing = list?.users.find(
                (u) => u.email?.toLowerCase() === email!.toLowerCase()
              );
              if (existing) {
                authUserId = existing.id;
              } else {
                console.error(
                  "[stripe webhook] apply_anonymous user already exists but listUsers couldn't find by email",
                  { email, sessionId: session.id }
                );
                break;
              }
            } else {
              console.error(
                "[stripe webhook] apply_anonymous createUser failed:",
                createRes.error.message
              );
              break;
            }
          } else if (createRes.data.user) {
            authUserId = createRes.data.user.id;
          }
        } else {
          // Authenticated flow — auth_user_id from client_reference_id.
          if (!authUserId) {
            console.error(
              "[stripe webhook] checkout.session.completed missing auth_user_id",
              session.id
            );
            break;
          }

          // Resolve the auth user's email so we can satisfy momfluencers.email NOT NULL.
          const { data: userResp } =
            await supabase.auth.admin.getUserById(authUserId);
          email = userResp?.user?.email ?? session.customer_email ?? null;
        }

        if (!authUserId) {
          console.error(
            "[stripe webhook] could not resolve authUserId",
            session.id
          );
          break;
        }

        if (!email) {
          console.error(
            "[stripe webhook] checkout.session.completed could not resolve email",
            { authUserId, sessionId: session.id }
          );
          break;
        }

        // Handle both modes:
        //   mode='payment'      → one-time $5 application fee (current flow,
        //                         2026-05-25 apply-for-a-spot pivot)
        //   mode='subscription' → legacy $5/mo subscription (Kelly, kevin+test5
        //                         and any user still on the old flow)
        //
        // In both cases we set status='approved' + membership_status='active'.
        // For the apply-for-a-spot flow, "approved" means: their application
        // payment cleared. The automated review (V2) will run separately and
        // can downgrade to 'rejected' + initiate refund if criteria fail.
        const isApplicationFee = session.mode === "payment";
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

        if (!error) {
          console.log(
            `[stripe webhook] momfluencer activated (mode=${session.mode}, isApplicationFee=${isApplicationFee})`,
            authUserId
          );
        }

        if (error) {
          console.error("[stripe webhook] failed to upsert momfluencer:", error.message);
        }

        if (!error && customerId) {
          // Anonymous apply flow (ApplyHero → /api/apply/start → Stripe) never
          // fires CompleteRegistration in the browser — the user has no Supabase
          // session before Stripe, so the pixel CR helper has no authUserId. We
          // fire it here once the webhook resolves authUserId post-payment. The
          // canonical event_id matches what the browser pixel WOULD have fired
          // (`complete_registration_${authUserId}`) so the authenticated SSO/
          // email flows still dedupe correctly if a user happens to hit both.
          if (isAnonymousApply) {
            void fireServerSideCompleteRegistration({
              authUserId,
              email,
              eventTimeUnixSeconds: event.created,
              eventSourceUrl: "https://momfluence.app/signup",
            });
          }

          // Fire Meta CAPI Purchase server-side, in parallel with the browser pixel
          // and Stape CAPIG. Meta dedupes on event_id = `purchase_${session.id}`
          // (same id /welcome's fireMetaPurchase passes). See
          // docs/planning/server-side-capi-from-stripe-webhook.md.
          //
          // Fire-and-forget: do NOT await — the webhook must respond fast and a
          // CAPI failure must never delay/block Stripe's 200.
          // amount_total is in the smallest currency unit (cents for USD); the
          // /welcome page fires a fixed $5.00 Purchase, so we mirror that exactly
          // when amount_total is missing or zero (e.g. fully discounted via promo
          // code) to keep browser + server event values aligned for dedupe.
          const amountTotal = typeof session.amount_total === "number" ? session.amount_total : 0;
          const value = amountTotal > 0 ? amountTotal / 100 : 5.0;
          const currency = (session.currency || "usd").toUpperCase();
          void fireServerSidePurchase({
            email,
            stripeCustomerId: customerId,
            stripeCheckoutSessionId: session.id,
            value,
            currency,
            eventTimeUnixSeconds: event.created,
            eventSourceUrl: "https://momfluence.app/welcome",
          });
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
