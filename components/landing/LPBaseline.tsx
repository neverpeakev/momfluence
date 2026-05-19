/**
 * <LPBaseline />
 *
 * The unified below-the-fold template every /lp/<variant> inherits.
 * Server Component — runs once per request and renders 9 sections (each
 * wrapped in <LPSectionTracker /> so funnel-depth events fire on scroll).
 *
 * Architecture: see docs/planning/lp-baseline-upgrade.md
 *
 * Variant above-the-fold (hero + brand ribbon) stays in
 * app/lp/[variant]/page.tsx. This component ONLY renders below the fold.
 *
 * Feature flag: NEXT_PUBLIC_LP_BASELINE_V2 = "off" | "shadow" | "live"
 *   - off (default): not rendered, page falls back to legacy below-fold
 *   - shadow: rendered but only on preview deploys (controlled via the
 *     variant page-level conditional, not here)
 *   - live: rendered for all production traffic
 *
 * Pricing cookie: set in middleware (lib/supabase/middleware.ts) on the
 * first /lp/* request, so the cookie is available to client components
 * on this very request without requiring a Server Action / Route Handler.
 * Next.js 15 forbids cookies().set() from a Server Component, hence the
 * middleware pattern.
 */

import LPSectionTracker from "./LPSectionTracker";
import MidPageCTA from "./MidPageCTA";
import { LP_SECTION_EVENTS } from "@/lib/funnel-lab/lp-events";

import SectionHowItWorks from "./sections/SectionHowItWorks";
import SectionAffiliateMarketing101 from "./sections/SectionAffiliateMarketing101";
import SectionMyriadWaysToShare from "./sections/SectionMyriadWaysToShare";
import SectionEarningsCalculator from "./sections/SectionEarningsCalculator";
import SectionDashboardTour from "./sections/SectionDashboardTour";
import SectionBrandWall from "./sections/SectionBrandWall";
import SectionComparison from "./sections/SectionComparison";
import SectionPricingABTest from "./sections/SectionPricingABTest";
import SectionFAQ from "./sections/SectionFAQ";
import SectionClosingCTA from "./sections/SectionClosingCTA";

interface Props {
  /** Variant slug — currently only used for analytics breadcrumb / debug. */
  variantSlug: string;
  /** /signup href pre-encoded with ?lp=&c=. Pricing variant gets appended client-side. */
  signupHref: string;
  /** Variant-specific closing CTA copy from variants.ts. */
  closer: {
    headline: string;
    subhead: string;
    ctaPrimary: string;
  };
}

export default async function LPBaseline({ signupHref, closer }: Props) {
  // Pricing variant cookie is seeded by middleware on /lp/* requests
  // (see lib/supabase/middleware.ts). Sticky for 90 days; new visitors get
  // "C" (Variant B parked — see SectionPricingABTest.tsx header).
  // This component is purely a read-through; nothing to do here.

  // Mid-page CTAs and Closing CTA all point at /signup with pricing_variant=C
  // appended so Stripe metadata stays accurate even before SectionPricingABTest
  // runs client-side. signupHref already carries ?lp=&c= so we always & here.
  const signupHrefC = signupHref.includes("?")
    ? `${signupHref}&pricing_variant=C`
    : `${signupHref}?pricing_variant=C`;

  return (
    <>
      <LPSectionTracker event={LP_SECTION_EVENTS.HowItWorks}>
        <SectionHowItWorks />
      </LPSectionTracker>

      <LPSectionTracker event={LP_SECTION_EVENTS.Education}>
        <SectionAffiliateMarketing101 />
      </LPSectionTracker>

      <LPSectionTracker event={LP_SECTION_EVENTS.ShareChannels}>
        <SectionMyriadWaysToShare />
      </LPSectionTracker>

      {/* SectionSocialProof removed 2026-05-19: the founder-led note + the
          "we're early" framing read apologetic + dated next to the dub.co-
          style proof patterns the rest of the page now uses. The hero-
          adjacent <HeroSocialProof /> chip (stars + avatar stack + "Join
          our founding momfluencers") now carries the social-proof load at
          the much higher-attention top-of-page position. Once we have
          5+ real members with photos + earnings consent, this slot may
          come back as a dub.co-style partner-cards grid. */}

      <MidPageCTA
        eyebrow="Founder-backed"
        headline="If you don&apos;t earn your $5 back, Kevin personally makes it right."
        cta="Find out more — $5/mo"
        signupHref={signupHrefC}
      />

      <LPSectionTracker event={LP_SECTION_EVENTS.DashboardTour}>
        <SectionDashboardTour />
      </LPSectionTracker>

      <LPSectionTracker event={LP_SECTION_EVENTS.BrandWall}>
        <SectionBrandWall />
      </LPSectionTracker>

      <MidPageCTA
        eyebrow="All 22 brands, one membership"
        headline="Skip the applications. Open the door for $5/mo."
        cta="Get the keys — $5/mo"
        signupHref={signupHrefC}
      />

      <LPSectionTracker event={LP_SECTION_EVENTS.Comparison}>
        <SectionComparison />
      </LPSectionTracker>

      {/* EarningsCalc moved down (was between ShareChannels and DashboardTour)
          per 2026-05-18 ordering decision: the visitor's "what does this
          realistically pay?" question lands AFTER catalog + comparison so the
          answer fires with full context. */}
      <LPSectionTracker event={LP_SECTION_EVENTS.EarningsCalc}>
        <SectionEarningsCalculator />
      </LPSectionTracker>

      <MidPageCTA
        eyebrow="Like the math?"
        headline="Lock in your number. Start sharing today."
        cta="Get yours — $5/mo"
        signupHref={signupHrefC}
      />

      <LPSectionTracker event={LP_SECTION_EVENTS.Pricing}>
        <SectionPricingABTest signupHref={signupHref} />
      </LPSectionTracker>

      <LPSectionTracker event={LP_SECTION_EVENTS.FAQ}>
        <SectionFAQ />
      </LPSectionTracker>

      <LPSectionTracker event={LP_SECTION_EVENTS.ClosingCTA}>
        <SectionClosingCTA
          headline={closer.headline}
          subhead={closer.subhead}
          ctaPrimary={closer.ctaPrimary}
          signupHref={signupHref}
        />
      </LPSectionTracker>
    </>
  );
}
