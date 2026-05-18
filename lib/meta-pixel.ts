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
  | "Lead"
  | "ViewContent"
  | "AddToCart";

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
  "Lead",
  "ViewContent",
  "AddToCart",
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

/**
 * Fires ViewContent for an LP variant. Use from <LPVisitTracker /> on mount.
 *
 * Why it matters: gives Meta an early-funnel signal — "this user engaged with
 * an LP." Combined with later AddToCart / InitiateCheckout / Purchase events,
 * Meta has more rungs on the optimization ladder, so it can find similar
 * users with less data.
 *
 * Browser event_id deterministically derives from the variant + a per-session
 * nonce so server-side CAPI (future Phase 2) can dedupe. For now, fbevents.js
 * generates its own internal eventID if we don't supply one — that's fine.
 */
export function fireMetaViewContent(
  variantSlug: string,
  creativeId?: string,
): void {
  fireMetaEvent("ViewContent", {
    content_name: `lp_${variantSlug}`,
    content_category: "landing_page",
    content_ids: creativeId ? [`lp_${variantSlug}__${creativeId}`] : [`lp_${variantSlug}`],
    content_type: "product",
  });
}

/**
 * Fires AddToCart when the user starts engaging with the signup form on
 * /signup. Treats "started the form" as the cart-add equivalent — the
 * conventional e-commerce intent signal one step before InitiateCheckout.
 *
 * Standard event with value=5.00 USD so Meta knows the eventual conversion
 * value if this user converts.
 */
export function fireMetaAddToCart(): void {
  fireMetaEvent("AddToCart", {
    value: 5.0,
    currency: "USD",
    content_name: "MomFluence Membership",
    content_type: "product",
    content_category: "Subscription",
  });
}

/**
 * Fires InitiateCheckout right before the client-side window.location.href
 * redirect to Stripe Checkout. The conventional commit signal — strongest
 * intent indicator before Purchase itself.
 *
 * Standard event with value=5.00 USD.
 */
export function fireMetaInitiateCheckout(): void {
  fireMetaEvent("InitiateCheckout", {
    value: 5.0,
    currency: "USD",
    content_name: "MomFluence Membership",
    content_type: "product",
    content_category: "Subscription",
    num_items: 1,
  });
}
