const V2_PIXEL_ID = "1468831514190648";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type StandardEvent =
  | "Purchase"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Subscribe"
  | "Lead";

type CustomEvent =
  | "SignupStarted"
  | "CheckoutStarted"
  | "PayoutSetupCompleted"
  | "WithdrawalRequested";

type EventName = StandardEvent | CustomEvent;

interface MetaEventData {
  value?: number;
  currency?: string;
  content_type?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  num_items?: number;
  [key: string]: unknown;
}

const STANDARD_EVENTS: ReadonlyArray<StandardEvent> = [
  "Purchase",
  "CompleteRegistration",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Subscribe",
  "Lead"
];

/**
 * Fires a Meta pixel event scoped ONLY to the v2 primary pixel (1468831514190648).
 * Uses trackSingle / trackSingleCustom to avoid firing on legacy v1 pixels and polluting their history.
 * Stape CAPIG automatically captures and forwards events server-side to Meta CAPI.
 *
 * Standard events (Purchase, CompleteRegistration, etc.) use fbq.trackSingle.
 * Custom events (SignupStarted, CheckoutStarted, etc.) use fbq.trackSingleCustom.
 *
 * When `eventId` is provided, it's passed via fbq's 5th positional arg as `{ eventID }`,
 * which Meta uses to dedupe browser + server-side CAPI events within 24h.
 */
export function fireMetaEvent(
  eventName: EventName,
  data?: MetaEventData,
  eventId?: string
): void {
  if (typeof window === "undefined" || !window.fbq) {
    // SSR or pixel hasn't loaded yet — silently skip.
    return;
  }

  const isStandard = (STANDARD_EVENTS as ReadonlyArray<string>).includes(eventName);
  const eventData = data || {};

  if (isStandard) {
    if (eventId) {
      window.fbq("trackSingle", V2_PIXEL_ID, eventName, eventData, { eventID: eventId });
    } else {
      window.fbq("trackSingle", V2_PIXEL_ID, eventName, eventData);
    }
  } else {
    if (eventId) {
      window.fbq("trackSingleCustom", V2_PIXEL_ID, eventName, eventData, { eventID: eventId });
    } else {
      window.fbq("trackSingleCustom", V2_PIXEL_ID, eventName, eventData);
    }
  }
}

/**
 * Convenience helper for the most common event we'll fire: Purchase.
 * Use this from /welcome page after Stripe Checkout success.
 *
 * Pass `eventId` (e.g. `purchase_${stripeCheckoutSessionId}`) so this fires with
 * the same eventID as the server-side CAPI call from the Stripe webhook — Meta
 * dedupes the two on `event_id`.
 */
export function fireMetaPurchase(
  value: number,
  currency = "USD",
  eventId?: string
): void {
  fireMetaEvent(
    "Purchase",
    {
      value,
      currency,
      content_type: "product",
      content_name: "MomFluence Membership",
      content_category: "Subscription"
    },
    eventId
  );
}
