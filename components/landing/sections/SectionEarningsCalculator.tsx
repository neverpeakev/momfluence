"use client";

/**
 * §3.5 — Earnings Calculator
 *
 * Interactive trust-builder introduced by the Design Agent's 2026-05-18
 * visual sprint. Two sliders + a $25 fast-track callout.
 *
 *   • Friends I'll share with     (1–50, default 8)
 *   • Average $/friend per month  (3–15, default $7)
 *
 * Result panel shows monthly + 12-month projections, minus the $60/yr
 * membership cost, with a coral "Net" callout. Fires
 * LP_EarningsCalc_Engaged on the FIRST slider interaction (once per
 * mount) — strong mid-funnel intent signal for Meta.
 *
 * FTC: numbers are explicitly framed as illustrative in the copy, plus
 * a density="compact" disclaimer below the result and density="full"
 * below the whole card.
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import EarningsDisclaimerInline from "@/components/landing/EarningsDisclaimerInline";
import { fireLPEarningsCalcEngaged } from "@/lib/funnel-lab/lp-events";

const FRIENDS_DEFAULT = 8;
const PER_FRIEND_DEFAULT = 7;
const MEMBERSHIP_YEARLY_USD = 60;
const FAST_TRACK_USD = 25;

export default function SectionEarningsCalculator() {
  const [friends, setFriends] = useState(FRIENDS_DEFAULT);
  const [perFriend, setPerFriend] = useState(PER_FRIEND_DEFAULT);
  const engagedRef = useRef(false);

  const monthly = friends * perFriend;
  const annual = monthly * 12;
  const net = annual - MEMBERSHIP_YEARLY_USD;

  function trackFirstEngage(nextFriends: number, nextPerFriend: number) {
    if (engagedRef.current) return;
    engagedRef.current = true;
    fireLPEarningsCalcEngaged(nextFriends, nextPerFriend);
  }

  return (
    <section className="mt-24" id="earnings-calculator">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Math, not magic
        </p>
        <h2 className="mt-2 text-3xl text-navy-900 sm:text-4xl">
          Slide it. See what your group chat is worth.
        </h2>
        <p className="mt-3 max-w-2xl text-base text-navy-600 sm:text-lg">
          Drag the sliders below. The math is the same math an affiliate manager uses —
          we just made it touch-friendly. Numbers are illustrative; your mileage depends
          on which brands you share and how often.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-10 rounded-3xl bg-white p-6 ring-1 ring-navy-100 shadow-sm sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          {/* Sliders */}
          <div className="space-y-7">
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="calc-friends" className="text-sm font-semibold text-navy-800">
                  Friends who sign up
                </label>
                <span className="text-2xl font-bold text-navy-900">{friends}</span>
              </div>
              <input
                id="calc-friends"
                type="range"
                min={1}
                max={50}
                value={friends}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setFriends(next);
                  trackFirstEngage(next, perFriend);
                }}
                className="mt-2 w-full accent-coral-500"
                aria-label="Friends who sign up"
              />
              <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                <span>1</span>
                <span>10</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="calc-per" className="text-sm font-semibold text-navy-800">
                  Average $/friend per month
                </label>
                <span className="text-2xl font-bold text-navy-900">${perFriend}</span>
              </div>
              <input
                id="calc-per"
                type="range"
                min={3}
                max={15}
                value={perFriend}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPerFriend(next);
                  trackFirstEngage(friends, next);
                }}
                className="mt-2 w-full accent-coral-500"
                aria-label="Average dollars per friend per month"
              />
              <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                <span>$3 (streaming heavy)</span>
                <span>$9 (mixed)</span>
                <span>$15 (high-payout)</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-coral-50 p-4 ring-1 ring-coral-200">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-coral-600">
                  Fast-track
                </p>
                <p className="mt-0.5 text-sm text-navy-700">
                  Your first <span className="font-semibold text-navy-900">${FAST_TRACK_USD}</span>{" "}
                  lands same-day so you can verify.
                </p>
              </div>
              <p className="text-2xl font-bold text-coral-700">+${FAST_TRACK_USD}</p>
            </div>
          </div>

          {/* Result panel */}
          <div className="lg:w-80">
            <div className="relative rounded-2xl bg-navy-900 p-6 text-white shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-coral-300">
                Estimated recurring
              </p>
              <p className="mt-2 text-5xl font-bold leading-none tracking-tight">
                ${monthly.toLocaleString()}
                <span className="align-baseline text-xl font-medium text-navy-200">/mo</span>
              </p>
              <div className="mt-5 h-px bg-navy-700" />
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm text-navy-200">Over 12 months</span>
                <span className="text-2xl font-bold">~${annual.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm text-navy-200">Membership cost</span>
                <span className="text-sm text-navy-100">${MEMBERSHIP_YEARLY_USD}/yr</span>
              </div>
              <div className="mt-4 rounded-lg bg-coral-500/15 px-3 py-2 ring-1 ring-coral-400/30">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-coral-200">
                  Net
                </p>
                <p className="mt-0.5 text-xl font-bold text-coral-200">
                  ~${net.toLocaleString()} after $5/mo
                </p>
              </div>
            </div>
            <EarningsDisclaimerInline density="compact" className="mt-3 text-center" />
          </div>
        </div>
      </motion.div>

      <EarningsDisclaimerInline density="full" className="mt-6" />
    </section>
  );
}
