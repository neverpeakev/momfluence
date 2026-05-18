"use client";

/**
 * §5 — Brand wall
 *
 * 22+ real brands from the live offers table, grouped by vertical, with
 * highlight cards for the 6 highest-paying partnerships.
 *
 * Logo strategy: when /public/lp-baseline/logos/<slug>.svg exists, render
 * it. Else render a styled brand-name card. Design agent ships logos as
 * they're sourced — this component degrades gracefully.
 */

import { motion } from "framer-motion";
import {
  BRANDS,
  HIGHLIGHTED_BRANDS,
  VERTICALS,
  payoutLabel,
  type BrandWallBrand,
} from "@/lib/landing/brand-wall-data";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";

function BrandCard({ brand }: { brand: BrandWallBrand }) {
  return (
    <div className="flex items-center justify-center rounded-xl bg-white p-4 ring-1 ring-navy-100 hover:ring-coral-200 transition-shadow">
      <p className="text-center text-sm font-semibold text-navy-800">{brand.brand}</p>
    </div>
  );
}

function HighlightCard({ brand }: { brand: BrandWallBrand }) {
  return (
    <div className="rounded-2xl bg-coral-50 p-5 ring-2 ring-coral-200">
      <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
        {VERTICALS.find((v) => v.slug === brand.vertical)?.label ?? brand.vertical}
      </p>
      <p className="mt-2 text-xl font-semibold text-navy-900">{brand.brand}</p>
      <p className="mt-2 text-base text-coral-700 font-semibold">{payoutLabel(brand)}</p>
      <p className="mt-2 text-xs text-navy-600">
        {brand.payoutType === "rev_share"
          ? "Recurring monthly commission for as long as the customer stays subscribed."
          : brand.payoutType === "cpl"
          ? "Paid out per qualified lead (signup with valid info)."
          : "Paid out per confirmed purchase or signup."}
      </p>
    </div>
  );
}

export default function SectionBrandWall() {
  return (
    <section className="mt-24" id="brands">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          {BRANDS.length}+ brands across {VERTICALS.length} categories
        </p>
        <h2 className="mt-2 text-3xl text-navy-900 sm:text-4xl">
          Real brands. Real payouts. No applications.
        </h2>
        <p className="mt-3 text-base text-navy-600 sm:text-lg">
          Every brand below has already approved MomFluence as a partner.
          You don&apos;t apply, you don&apos;t wait, you don&apos;t need a
          following. Pick the brand, generate your link, share.
        </p>
      </motion.div>

      {/* Highlight cards */}
      <div className="mt-10">
        <p className="text-xs uppercase tracking-widest text-navy-500 font-semibold">
          Top-paying programs right now
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTED_BRANDS.map((b, i) => (
            <motion.div
              key={b.brand}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: 0.05 * i, ease: "easeOut" }}
            >
              <HighlightCard brand={b} />
            </motion.div>
          ))}
        </div>
        <EarningsDisclaimerInline density="compact" className="mt-3" />
      </div>

      {/* Full brand grid */}
      <div className="mt-12">
        <p className="text-xs uppercase tracking-widest text-navy-500 font-semibold">
          Full active partner list
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {BRANDS.map((b) => (
            <BrandCard key={b.brand} brand={b} />
          ))}
        </motion.div>
      </div>

      <p className="mt-8 text-sm text-navy-600">
        <span className="font-semibold text-navy-900">New brands added every week.</span>{" "}
        Members get first access to new programs before they&apos;re announced publicly.
      </p>
    </section>
  );
}
