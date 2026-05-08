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
 */
export function fireMetaEvent(eventName: EventName, data?: MetaEventData): void {
  if (typeof window === "undefined" || !window.fbq) {
    // SSR or pixel hasn't loaded yet — silently skip.
    return;
  }

  const isStandard = (STANDARD_EVENTS as ReadonlyArray<string>).includes(eventName);

  if (isStandard) {
    window.fbq("trackSingle", V2_PIXEL_ID, eventName, data || {});
  } else {
    window.fbq("trackSingleCustom", V2_PIXEL_ID, eventName, data || {});
  }
}

/**
 * Convenience helper for the most common event we'll fire: Purchase.
 * Use this from /welcome page after Stripe Checkout success.
 */
export function fireMetaPurchase(value: number, currency = "USD"): void {
  fireMetaEvent("Purchase", {
    value,
    currency,
    content_type: "product",
    content_name: "MomFluence Membership",
    content_category: "Subscription"
  });
}
