/**
 * LP baseline event names + thin wrappers around fbq.
 *
 * Why a separate module: the LP baseline introduces ~9 section-view events
 * + a few interaction events. Keeping the names in a single typed module
 * means:
 *   - No magic strings sprinkled across components
 *   - Meta Events Manager → Custom Events table matches code grep results
 *   - Easy to fire in batch (e.g. when LPSectionTracker observer triggers)
 *
 * All events fire ONLY to the v2 primary pixel (1468831514190648) via
 * fireMetaEvent() in lib/meta-pixel.ts. Stape CAPIG mirrors them server-side
 * automatically (the parallel-event mechanism on capig.momfluence.app).
 *
 * Standard conversion events (ViewContent, AddToCart, InitiateCheckout,
 * Purchase) live in lib/meta-pixel.ts and have richer typed helpers there.
 * THIS module is for the LP-specific custom events.
 */

import { fireMetaEvent } from "@/lib/meta-pixel";
import type { PricingVariant } from "./pricing-variants";

/** All LP baseline section-view events. */
export const LP_SECTION_EVENTS = {
  HowItWorks: "LP_Section_View_HowItWorks",
  Education: "LP_Section_View_Education",
  ShareChannels: "LP_Section_View_ShareChannels",
  DashboardTour: "LP_Section_View_DashboardTour",
  BrandWall: "LP_Section_View_BrandWall",
  SocialProof: "LP_Section_View_SocialProof",
  Pricing: "LP_Section_View_Pricing",
  FAQ: "LP_Section_View_FAQ",
  ClosingCTA: "LP_Section_View_ClosingCTA",
} as const;

export type LPSectionEventName = (typeof LP_SECTION_EVENTS)[keyof typeof LP_SECTION_EVENTS];

/** All LP baseline interaction events. */
export const LP_INTERACTION_EVENTS = {
  PricingVariantAssigned: "LP_PricingVariant_Assigned",
  PricingCTAClicked: "LP_PricingCTA_Clicked",
  ShareChannelClicked: "LP_ShareChannel_Clicked",
  DashboardScreenshotViewed: "LP_DashboardScreenshot_Viewed",
  BrandPayoutExampleClicked: "LP_Brand_PayoutExample_Clicked",
  FAQOpened: "LP_FAQ_Opened",
  VideoTestimonialPlayed: "LP_VideoTestimonial_Played",
  ClosingCTAClicked: "LP_ClosingCTA_Clicked",
} as const;

/**
 * Fire a section-view event. Called by <LPSectionTracker /> when a section
 * crosses 50% of viewport.
 */
export function fireLPSectionView(section: LPSectionEventName, extra?: Record<string, unknown>): void {
  // fireMetaEvent currently types eventName as a closed union of standard +
  // custom events. The LP_Section_* names are NEW custom events we're adding
  // — cast at the boundary, but keep the call-site fully typed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fireMetaEvent(section as any, extra);
}

/**
 * Fire when a pricing variant is assigned (browser-side, on first LP visit).
 * Includes the assigned variant so Meta sees the split in audience signal.
 */
export function fireLPPricingAssigned(variant: PricingVariant): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fireMetaEvent(LP_INTERACTION_EVENTS.PricingVariantAssigned as any, {
    pricing_variant: variant,
  });
}

/**
 * Fire when the user clicks the pricing CTA. Includes which variant was
 * shown so we can decompose CTR by variant later.
 */
export function fireLPPricingCTAClicked(variant: PricingVariant): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fireMetaEvent(LP_INTERACTION_EVENTS.PricingCTAClicked as any, {
    pricing_variant: variant,
  });
}

/**
 * Fire when the user opens a FAQ item. `index` is the 0-based position in
 * the FAQ list so we can see *which* questions matter to readers.
 */
export function fireLPFAQOpened(index: number, questionShort: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fireMetaEvent(LP_INTERACTION_EVENTS.FAQOpened as any, {
    faq_index: index,
    faq_question: questionShort,
  });
}

/**
 * Fire when the user clicks the closing CTA on the LP. Used to measure
 * scroll-depth-converters (people who read everything before signing up).
 */
export function fireLPClosingCTAClicked(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fireMetaEvent(LP_INTERACTION_EVENTS.ClosingCTAClicked as any);
}
