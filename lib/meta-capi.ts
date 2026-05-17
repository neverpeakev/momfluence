/**
 * Server-side Meta Conversions API (CAPI) helper.
 *
 * Posts Purchase events directly to Meta from our Stripe webhook, in parallel
 * with the browser pixel + Stape CAPIG path. Meta dedupes on `event_id` within
 * 24h, so all three paths land in one Purchase row in Events Manager.
 *
 * Phase 1: email + external_id (hashed stripe_customer_id). Phase 2 (fbp/fbc
 * cookies forwarded via Stripe Checkout metadata) is intentionally not in scope
 * here — see docs/planning/server-side-capi-from-stripe-webhook.md.
 *
 * IMPORTANT: every Meta call here is wrapped so a CAPI failure NEVER throws
 * back to the caller. The Stripe webhook must keep writing the momfluencers
 * row even if Meta is down or our token is misconfigured.
 */
import { createHash } from "node:crypto";

const META_API_VERSION = "v20.0";
const META_PIXEL_ID = "1468831514190648"; // v2 primary; same id used by lib/meta-pixel.ts
const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

interface FireServerSidePurchaseInput {
  email: string;
  stripeCustomerId: string;
  stripeCheckoutSessionId: string;
  value: number;
  currency: string;
  /** Unix seconds — use the `created` field on the Stripe event. */
  eventTimeUnixSeconds: number;
  /** e.g. "https://momfluence.app/welcome" — must match the browser pixel's page URL. */
  eventSourceUrl: string;
  /** Optional — not currently passed (Stripe doesn't expose the buyer's IP). */
  clientIpAddress?: string;
  /** Optional — not currently passed. */
  clientUserAgent?: string;
}

interface MetaUserData {
  em: string[];
  external_id: string[];
  client_ip_address?: string;
  client_user_agent?: string;
}

interface MetaCustomData {
  currency: string;
  value: number;
  content_type: string;
  content_name: string;
  content_category: string;
}

interface MetaEvent {
  event_name: "Purchase";
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: "website";
  user_data: MetaUserData;
  custom_data: MetaCustomData;
}

/**
 * Fire a Purchase event to Meta CAPI server-side. Best-effort: any error is
 * logged but swallowed. Caller does not need to await this; the webhook can
 * fire-and-forget so the 200 response isn't delayed by Meta's RTT.
 */
export async function fireServerSidePurchase(
  input: FireServerSidePurchaseInput
): Promise<void> {
  const token = process.env.META_MARKETING_API_TOKEN;
  if (!token) {
    console.error(
      "[meta-capi] META_MARKETING_API_TOKEN not set; skipping server-side Purchase event"
    );
    return;
  }

  try {
    const eventId = `purchase_${input.stripeCheckoutSessionId}`;
    const hashedEmail = sha256Hex(normalizeEmail(input.email));
    const hashedExternalId = sha256Hex(input.stripeCustomerId);

    const userData: MetaUserData = {
      em: [hashedEmail],
      external_id: [hashedExternalId],
    };
    if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
    if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;

    const metaEvent: MetaEvent = {
      event_name: "Purchase",
      event_time: input.eventTimeUnixSeconds,
      event_id: eventId,
      event_source_url: input.eventSourceUrl,
      action_source: "website",
      user_data: userData,
      custom_data: {
        currency: input.currency,
        value: input.value,
        content_type: "product",
        content_name: "MomFluence Membership",
        content_category: "Subscription",
      },
    };

    const url = `${META_GRAPH_BASE}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(
      token.trim()
    )}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [metaEvent] }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[meta-capi] Purchase event POST failed: ${res.status} ${body.slice(0, 500)}`
      );
      return;
    }

    // Light success log — useful for verifying via Vercel logs that the
    // server-side event actually went out.
    console.log(
      `[meta-capi] Purchase event sent (event_id=${eventId}, customer=${input.stripeCustomerId})`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[meta-capi] unexpected error firing Purchase: ${message}`);
  }
}
