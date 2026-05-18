"use client";

/**
 * §9 — Closing CTA (variant-specific voice)
 *
 * Takes variant-specific copy via props from variants.ts. Closes the LP
 * by restating the offer in the same voice the hero used. Click fires
 * LP_ClosingCTA_Clicked for funnel-depth (we measure how many converters
 * read all the way down).
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { fireLPClosingCTAClicked } from "@/lib/funnel-lab/lp-events";

interface Props {
  headline: string;
  subhead: string;
  ctaPrimary: string;
  signupHref: string;
}

export default function SectionClosingCTA({ headline, subhead, ctaPrimary, signupHref }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-24"
    >
      <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-10 text-center sm:p-14">
        {/* Soft coral atmosphere — single radial, no gradient slop. Agent
            spec: "brand signature: every long page ends in this dark zone". */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(240,74,37,0.18), transparent)",
          }}
        />

        <h2 className="relative text-balance text-4xl text-white sm:text-5xl">
          {headline}
        </h2>
        <p className="relative mx-auto mt-4 max-w-2xl text-base text-navy-200 sm:text-lg">
          {subhead}
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={signupHref}
            onClick={() => fireLPClosingCTAClicked()}
            className="btn-primary no-underline"
          >
            {ctaPrimary}
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-navy-700 bg-transparent px-5 py-3 font-medium text-navy-100 no-underline transition hover:bg-navy-800"
          >
            Read the full breakdown →
          </Link>
        </div>
        <p className="relative mt-6 text-xs text-navy-400">
          $5/mo membership. Cancel anytime. Example earnings shown elsewhere on
          this page are illustrative — individual results vary.
        </p>
      </div>
    </motion.section>
  );
}
