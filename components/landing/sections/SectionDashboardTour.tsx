"use client";

/**
 * §4 — Inside the dashboard
 *
 * Demystifies "what am I paying $5/mo for?" Uses the existing
 * <DashboardPreview /> component (which already shows a realistic mock
 * of the earnings dashboard) plus annotated callouts for the four core
 * surfaces: brand picker, link generator, earnings, cashout.
 *
 * Phase 2 (when real screenshots are captured by design agent): swap
 * the existing preview for actual production screenshots in
 * /public/lp-baseline/dashboard/. Until then, <DashboardPreview /> is
 * itself based on real production data and is a faithful representation.
 */

import { motion } from "framer-motion";
import DashboardPreview from "@/components/landing/DashboardPreview";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";

const FEATURES = [
  {
    n: 1,
    title: "Brand picker",
    body: "Browse 20+ curated brand programs. Filter by vertical — streaming, beauty, savings apps, family safety. Each program shows the commission, what the brand pays, and what you take home.",
  },
  {
    n: 2,
    title: "One-click link generator",
    body: "Pick a brand, generate your tracked link in one tap. Copy to clipboard, paste anywhere. Each link is uniquely tied to your account so clicks attribute correctly.",
  },
  {
    n: 3,
    title: "Live earnings & clicks",
    body: "Every click on every link, in real time. See which channels and which brands are converting for you. Updated within minutes of the click.",
  },
  {
    n: 4,
    title: "Fast-track first cashout",
    body: "Most affiliate programs make you wait 60-90 days for your first payout. Our $25 fast-track lands in your dashboard same-day so you can verify it&apos;s real.",
  },
];

export default function SectionDashboardTour() {
  return (
    <section className="mt-24" id="inside-the-dashboard">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Inside the $5/mo membership
        </p>
        <h2 className="mt-2 text-3xl text-navy-900 sm:text-4xl">
          Your dashboard does the bragging.
        </h2>
        <p className="mt-3 text-base text-navy-600 sm:text-lg">
          The second you&apos;re in, you see exactly what&apos;s happening:
          clicks, signups, dollars earned this week. No guessing, no chasing
          brands, no spreadsheets.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div>
            <DashboardPreview />
            <EarningsDisclaimerInline density="compact" className="mt-3 text-center" />
          </div>
        </motion.div>

        <ol className="space-y-6">
          {FEATURES.map((feature, i) => (
            <motion.li
              key={feature.n}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.35, delay: 0.08 * i, ease: "easeOut" }}
              className="flex items-start gap-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-100 text-base font-bold text-coral-700">
                {feature.n}
              </span>
              <div>
                <h3 className="text-lg text-navy-900 font-semibold">{feature.title}</h3>
                <p
                  className="mt-2 text-base text-navy-700"
                  dangerouslySetInnerHTML={{ __html: feature.body }}
                />
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
