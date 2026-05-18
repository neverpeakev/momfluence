"use client";

/**
 * §6 — Social proof (Phase 1: founder-led)
 *
 * Phase 1 ships honest founder content: who we are, why we built this,
 * the wife who's actually using it. No stock photos, no fabricated
 * testimonials. Transparency is the trust signal.
 *
 * Phase 2 (T+14 days per docs/planning/lp-baseline-upgrade.md): swap
 * in 5+ real founding moms with photos and earnings. Until then, the
 * "first founding members" callout is honest about being early stage.
 */

import { motion } from "framer-motion";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";

export default function SectionSocialProof() {
  return (
    <section className="mt-24" id="social-proof">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Built in public
        </p>
        <h2 className="mt-2 text-3xl text-navy-900 sm:text-4xl">
          We&apos;re early. We&apos;re honest about it.
        </h2>
        <p className="mt-3 text-base text-navy-600 sm:text-lg">
          MomFluence is a brand-new platform. We&apos;re not going to pretend
          ten-thousand moms are already earning life-changing money. We&apos;ll
          be that platform — but we&apos;re building it transparently, one
          founding member at a time.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Founder card */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl bg-white p-6 ring-1 ring-navy-200"
        >
          <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
            From the founder
          </p>
          <h3 className="mt-2 text-xl text-navy-900">Kevin Neal — Never Peak Inc.</h3>
          <div className="mt-4 space-y-3 text-base leading-7 text-navy-700">
            <p>
              I built MomFluence after watching my wife recommend products to
              her friends for fifteen years without ever earning a dollar from
              it. Every time a friend bought something she suggested, the brand
              kept 100% — even when the brand had an affiliate program
              specifically designed to share with people exactly like her.
            </p>
            <p>
              The infrastructure to fix that has existed for two decades. It
              just wasn&apos;t built for moms. So we built it.
            </p>
            <p>
              I&apos;m the founder, the engineer, and the person who replies to
              every email at{" "}
              <a href="mailto:hello@momfluence.app" className="underline">
                hello@momfluence.app
              </a>
              . If you sign up and don&apos;t earn at least your $5 back in the
              first month, email me directly and I&apos;ll personally make it
              right.
            </p>
          </div>
        </motion.div>

        {/* Kelly (real first member) card */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="rounded-2xl bg-coral-50 p-6 ring-2 ring-coral-200"
        >
          <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
            First member
          </p>
          <h3 className="mt-2 text-xl text-navy-900">Kelly — Founding Member</h3>
          <div className="mt-4 space-y-3 text-base leading-7 text-navy-700">
            <p>
              Our very first paying member is the founder&apos;s wife — and
              we&apos;ll be honest about that. She&apos;s also a regular mom
              with three kids, a phone, and an active group chat. She&apos;s
              been quietly testing the platform from the inside since launch.
            </p>
            <p className="italic">
              &ldquo;I&apos;ve been the unpaid recommendation engine for our
              mom group for years. Now I just send the link instead of just the
              name. Nothing about how I share has changed.&rdquo;
            </p>
            <p className="text-sm text-navy-600">— Kelly, on the first week of using MomFluence</p>
          </div>
        </motion.div>
      </div>

      {/* Founding members callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mt-8 rounded-2xl bg-navy-50 p-6 ring-1 ring-navy-200"
      >
        <p className="text-xs uppercase tracking-widest text-navy-500 font-semibold">
          For early members
        </p>
        <h3 className="mt-2 text-lg text-navy-900">
          Founding member treatment for the first 100 signups.
        </h3>
        <p className="mt-3 text-sm leading-6 text-navy-700">
          We&apos;re onboarding our first 100 founding members with extra
          attention — direct access to the founder, priority on new brand
          additions, and a chance to be featured (with permission) in
          upcoming case studies. If you sign up now and stay for 30 days
          actively sharing links, we&apos;ll send you a personal video walkthrough
          of best practices.
        </p>
        <EarningsDisclaimerInline density="compact" className="mt-4" />
      </motion.div>

      {/* Reserved slot for Phase 2 real-mom testimonials */}
      <p className="mt-6 text-xs text-navy-500">
        More real-mom case studies — with photos, earnings figures, and video
        — coming over the next few weeks as our founding cohort builds up their
        first month of data.
      </p>
    </section>
  );
}
