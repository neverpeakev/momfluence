"use client";

/**
 * §2 — Affiliate Marketing 101
 *
 * Educational module for the truly uninitiated mom. The "completing a
 * financial circuit" framing inverts the typical "shilling" association.
 *
 * Three pieces:
 *   1. Plain-English definition
 *   2. Side-by-side: Without MomFluence (brand keeps 100%) vs With
 *      MomFluence (brand shares with mom)
 *   3. Real example with FTC disclaimer
 *   4. Historical legitimacy (it's how bloggers/podcasters/YouTubers have
 *      done this for 20 years)
 *
 * Voice lock v6: regular moms, big bucks, find out more.
 */

import { motion } from "framer-motion";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";

export default function SectionAffiliateMarketing101() {
  return (
    <section className="mt-24" id="affiliate-marketing-101">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Affiliate Marketing 101
        </p>
        <h2 className="mt-2 text-3xl text-navy-900 sm:text-4xl">
          You&apos;re already recommending stuff. The brands already pay for
          it. We just complete the circuit.
        </h2>
      </motion.div>

      <div className="mt-8 space-y-6 text-base leading-7 text-navy-700">
        <p>
          Affiliate marketing is when a brand pays you a percentage every time
          someone buys from them through your tracked link. It&apos;s not new.
          It&apos;s how thousands of bloggers, podcasters, and YouTubers have
          quietly earned for the last twenty years. Every &ldquo;link in bio&rdquo;
          on Instagram, every &ldquo;use code MOM10 at checkout,&rdquo; every
          podcast host saying &ldquo;our sponsor today is&hellip;&rdquo; — that&apos;s
          affiliate marketing.
        </p>
        <p>
          Brands set the budgets aside specifically for this. If nobody uses a
          tracked link when they sign up, the brand just keeps that money. You
          weren&apos;t taking it from anyone — you were the missing piece that
          completes a financial loop that was already designed.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl bg-navy-50 p-6 ring-1 ring-navy-200"
        >
          <p className="text-xs uppercase tracking-widest text-navy-500 font-semibold">
            Without MomFluence
          </p>
          <h3 className="mt-2 text-xl text-navy-900">
            Mom recommends. Brand keeps 100%.
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-navy-700">
            <li className="flex gap-2">
              <span className="text-navy-400">→</span>
              <span>Mom texts friend: &ldquo;You need to try Hulu&rdquo;</span>
            </li>
            <li className="flex gap-2">
              <span className="text-navy-400">→</span>
              <span>Friend signs up directly at hulu.com</span>
            </li>
            <li className="flex gap-2">
              <span className="text-navy-400">→</span>
              <span>Hulu collects the subscription fee</span>
            </li>
            <li className="flex gap-2">
              <span className="text-navy-400">→</span>
              <span className="font-semibold text-navy-900">Mom gets nothing.</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="rounded-2xl bg-coral-50 p-6 ring-2 ring-coral-200"
        >
          <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
            With MomFluence
          </p>
          <h3 className="mt-2 text-xl text-navy-900">
            Mom recommends. Brand shares.
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-navy-700">
            <li className="flex gap-2">
              <span className="text-coral-500">→</span>
              <span>Mom texts friend: &ldquo;You need to try Hulu&rdquo; — with her tracked link</span>
            </li>
            <li className="flex gap-2">
              <span className="text-coral-500">→</span>
              <span>Friend taps the link and signs up</span>
            </li>
            <li className="flex gap-2">
              <span className="text-coral-500">→</span>
              <span>Hulu pays a commission to MomFluence; we split it with Mom</span>
            </li>
            <li className="flex gap-2">
              <span className="text-coral-500">→</span>
              <span className="font-semibold text-navy-900">
                Mom earns every month her friend stays subscribed.
              </span>
            </li>
          </ul>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mt-10 rounded-2xl bg-white p-6 ring-1 ring-navy-100"
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Real example
        </p>
        <h3 className="mt-2 text-xl text-navy-900">
          Mom shares Hulu with five friends in her group chat.
        </h3>
        <div className="mt-4 grid gap-4 text-sm text-navy-700 sm:grid-cols-3">
          <div className="rounded-lg bg-navy-50 p-4">
            <p className="text-xs uppercase tracking-widest text-navy-500">If 5 friends sign up</p>
            <p className="mt-1 text-2xl font-semibold text-navy-900">$8/mo</p>
            <p className="mt-1 text-xs text-navy-600">recurring, while they stay subscribed</p>
          </div>
          <div className="rounded-lg bg-navy-50 p-4">
            <p className="text-xs uppercase tracking-widest text-navy-500">Over 12 months</p>
            <p className="mt-1 text-2xl font-semibold text-navy-900">~$96</p>
            <p className="mt-1 text-xs text-navy-600">from one group text</p>
          </div>
          <div className="rounded-lg bg-coral-50 p-4 ring-1 ring-coral-200">
            <p className="text-xs uppercase tracking-widest text-coral-600">Your effort</p>
            <p className="mt-1 text-2xl font-semibold text-navy-900">One text</p>
            <p className="mt-1 text-xs text-navy-600">that you probably would have sent anyway</p>
          </div>
        </div>
        <EarningsDisclaimerInline density="full" className="mt-4" />
      </motion.div>
    </section>
  );
}
