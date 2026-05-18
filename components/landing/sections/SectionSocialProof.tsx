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
 * Phase 2 cluster renders reserved tiles so the visual shape is locked
 * in (dub.co/partners-style cluster) and feels intentional rather than
 * empty. Tiles will hot-swap to real photos as `social-proof-data.ts`
 * fills in.
 */

import { motion } from "framer-motion";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";

const PHASE2_SLOTS = [
  { id: "p2-1", name: "Mom #1" },
  { id: "p2-2", name: "Mom #2" },
  { id: "p2-3", name: "Mom #3" },
  { id: "p2-4", name: "Mom #4" },
  { id: "p2-5", name: "Mom #5" },
];

function FounderAvatar({
  initials,
  ring = "bg-navy-200",
  size = 64,
}: {
  initials: string;
  ring?: string;
  size?: number;
}) {
  // Placeholder until real headshots drop into /public/lp-baseline/founders/.
  // Round chip + emerald "online" status dot, mirroring the agent's spec.
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-navy-700 ${ring}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials}
      <span className="absolute -bottom-1 -right-1 inline-block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
    </div>
  );
}

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
        <h2 className="mt-2 text-balance text-3xl text-navy-900 sm:text-4xl">
          We&apos;re early. We&apos;re honest about it.
        </h2>
        <p className="mt-3 max-w-2xl text-base text-navy-600 sm:text-lg">
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
          className="h-full rounded-2xl bg-white p-6 ring-1 ring-navy-200"
        >
          <div className="flex items-start gap-4">
            <FounderAvatar initials="KN" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-coral-600">
                From the founder
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-navy-900">
                Kevin Neal — Never Peak Inc.
              </h3>
            </div>
          </div>
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
          className="h-full rounded-2xl bg-coral-50 p-6 ring-2 ring-coral-200"
        >
          <div className="flex items-start gap-4">
            <FounderAvatar initials="K" ring="bg-coral-200" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-coral-600">
                First member
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-navy-900">
                Kelly — Founding Member
              </h3>
            </div>
          </div>
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
            <p className="text-sm text-navy-600">
              — Kelly, on the first week of using MomFluence
            </p>
          </div>
        </motion.div>
      </div>

      {/* Phase 2 — reserved 5-mom cluster, dub.co/partners-inspired.
          Tiles render as visible reserved slots until the founding cohort
          photos land in /public/lp-baseline/founders/p2-*.jpg + earnings
          data ships in lib/landing/social-proof-data.ts. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mt-12"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-500">
            Phase 2 · founding cohort (ships T+14 days)
          </p>
          <p className="text-[11px] text-navy-400">
            Real moms · photos · first-month earnings · channels they share through
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PHASE2_SLOTS.map((slot) => (
            <article
              key={slot.id}
              className="rounded-2xl bg-white p-3 ring-1 ring-navy-100"
            >
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-navy-200 bg-navy-50/60 text-center">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-navy-400">
                  Headshot
                  <br />
                  reserved
                </p>
              </div>
              <div className="mt-3 px-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-400">
                  First name
                </p>
                <p className="mt-0.5 text-sm font-semibold text-navy-900">
                  {slot.name}
                </p>
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-coral-600">
                  First month earned
                </p>
                <p className="mt-0.5 font-display text-base font-bold text-navy-900">
                  $—
                </p>
              </div>
            </article>
          ))}
        </div>
      </motion.div>

      {/* Founding members callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mt-8 rounded-2xl bg-navy-50 p-6 ring-1 ring-navy-200"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-500">
          For early members
        </p>
        <h3 className="mt-2 font-display text-lg font-bold text-navy-900">
          Founding member treatment for the first 100 signups.
        </h3>
        <p className="mt-3 text-sm leading-6 text-navy-700">
          We&apos;re onboarding our first 100 founding members with extra
          attention — direct access to the founder, priority on new brand
          additions, and a chance to be featured (with permission) in upcoming
          case studies. If you sign up now and stay for 30 days actively
          sharing links, we&apos;ll send you a personal video walkthrough of
          best practices.
        </p>
        <EarningsDisclaimerInline density="compact" className="mt-4" />
      </motion.div>

      <p className="mt-6 max-w-3xl text-xs text-navy-500">
        More real-mom case studies — with photos, earnings figures, and video —
        coming over the next few weeks as our founding cohort builds up their
        first month of data.
      </p>
    </section>
  );
}
