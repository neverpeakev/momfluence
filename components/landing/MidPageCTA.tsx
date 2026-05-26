"use client";

/**
 * <MidPageCTA />
 *
 * Inline mid-page call-to-action card that drops between LP baseline
 * sections. Lets a high-intent visitor convert without scrolling all the
 * way to §7 Pricing or §9 ClosingCTA.
 *
 * Three of these get placed across the page (after high-intent moments —
 * social proof, brand wall, earnings calc). Density is intentionally
 * moderate: enough that a convinced visitor has a button always within
 * reach, but not so many that the page reads as desperate.
 *
 * Fires the same LP_ClosingCTA_Clicked event as §9 — we don't want to
 * fragment the funnel into per-section CTA events. The funnel-depth
 * event-view tracker on the surrounding section already tells us which
 * point of the page the convert came from.
 *
 * Voice lock v6: "get yours", "find out more", "lock in".
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { fireLPClosingCTAClicked } from "@/lib/funnel-lab/lp-events";

interface Props {
  /** Short pre-headline / context above the headline. */
  eyebrow: string;
  /** One-line punch headline. */
  headline: string;
  /** CTA button text. */
  cta: string;
  /** /signup href pre-encoded with ?lp=&c=&pricing_variant=. */
  signupHref: string;
  /** Optional support text rendered under the button. */
  fineprint?: string;
}

export default function MidPageCTA({
  eyebrow,
  headline,
  cta,
  signupHref,
  fineprint = "$5 refundable deposit · credited to first payout · 22+ brands waiting",
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-16"
      aria-label="Sign up"
    >
      <div className="relative overflow-hidden rounded-2xl bg-coral-50 px-6 py-7 ring-2 ring-coral-200 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-8">
        {/* Soft coral wash, mirrors the §9 Closing CTA atmosphere at half intensity */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(240,74,37,0.12), transparent)",
          }}
        />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-600">
            {eyebrow}
          </p>
          <p className="mt-1 max-w-xl text-balance text-xl font-semibold text-navy-900 sm:text-2xl">
            {headline}
          </p>
        </div>

        <div className="relative mt-5 flex flex-col items-start gap-2 sm:mt-0 sm:items-end sm:text-right">
          <Link
            href={signupHref}
            onClick={() => fireLPClosingCTAClicked()}
            className="btn-primary no-underline whitespace-nowrap"
          >
            {cta}
          </Link>
          <p className="text-[11px] text-navy-500">{fineprint}</p>
        </div>
      </div>
    </motion.section>
  );
}
