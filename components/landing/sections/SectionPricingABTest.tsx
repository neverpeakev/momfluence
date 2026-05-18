"use client";

/**
 * §7 — Pricing (Variant C only as of 2026-05-18)
 *
 * Variant C — Skool-style exclusive — is the only pricing positioning
 * currently shipped to live traffic. Variant B (risk-reversed $5
 * credit-back) is INDEFINITELY PARKED until two conditions are met:
 *
 *   1. Variant C is proven not to work (need volume data first)
 *   2. Head of compliance has reviewed the Terms #membership-credit
 *      clause that operationalizes the $5 credit-back
 *
 * Decision logged in chat 2026-05-18. The Variant B component is kept
 * in this file (commented out as dead-code) so re-enabling it later is
 * a one-line revert when both conditions clear. The B/C cookie + Stripe
 * metadata wiring stays in place so reactivating B is purely a
 * front-end render flip.
 *
 * Variant B terms (when re-enabled): see app/terms#membership-credit
 * for the operational definition. Subscription remains $5/mo billed
 * monthly; once cumulative earnings hit $25, a $5 credit is applied to
 * the next dashboard balance (not a refund to the original payment
 * method). All described in the Terms.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  parsePricingVariant,
  PRICING_VARIANT_COOKIE,
  type PricingVariant,
} from "@/lib/funnel-lab/pricing-variants";
import {
  fireLPPricingAssigned,
  fireLPPricingCTAClicked,
} from "@/lib/funnel-lab/lp-events";

interface Props {
  signupHref: string;
}

function readVariantFromCookie(): PricingVariant | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${PRICING_VARIANT_COOKIE}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.split("=")[1] ?? "");
  return parsePricingVariant(raw);
}

function appendPricingVariant(href: string, variant: PricingVariant): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}pricing_variant=${variant}`;
}

export default function SectionPricingABTest({ signupHref }: Props) {
  const [pricingVariantInitialized, setPricingVariantInitialized] = useState(false);

  useEffect(() => {
    // Variant C is the only positioning currently in production.
    // We still read the cookie (or fall back to "C") so the same
    // pricing_variant tag lands in Stripe metadata — that keeps the
    // Funnel Lab admin rollup consistent and lets us reactivate the
    // A/B later without changing the data shape.
    const v = readVariantFromCookie() ?? "C";
    fireLPPricingAssigned(v);
    setPricingVariantInitialized(true);
  }, []);

  // SSR-safe placeholder until effect runs.
  if (!pricingVariantInitialized) {
    return (
      <section className="mt-24" id="pricing">
        <div className="rounded-3xl bg-white p-8 ring-2 ring-navy-300 sm:p-10">
          <div className="h-32 animate-pulse rounded-xl bg-navy-50" />
        </div>
      </section>
    );
  }

  // Always Variant C until Variant B is re-enabled — see file header.
  // The signup link always carries pricing_variant=C so Stripe metadata
  // stays accurate.
  const href = appendPricingVariant(signupHref, "C");
  return <VariantC signupHref={href} />;
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Variant B — Risk-reversed                                                */
/* ──────────────────────────────────────────────────────────────────────── */

function VariantB({ signupHref }: { signupHref: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-24"
      id="pricing"
    >
      <div className="rounded-3xl bg-white p-8 ring-2 ring-coral-200 sm:p-10">
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          $5/month — and we credit it back
        </p>
        <h2 className="mt-2 text-3xl text-navy-900 sm:text-4xl">
          Your first $25 earned? We send you a $5 credit.
        </h2>
        <p className="mt-3 text-base leading-7 text-navy-700">
          The membership pays for itself in week one for most active sharers.
          Pay $5 today. The moment your cumulative earnings hit $25, we credit
          $5 back to your dashboard balance — so your effective cost is zero
          if you actually use it.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-coral-50 p-4 ring-1 ring-coral-200">
            <p className="text-xs uppercase tracking-widest text-coral-600">Today</p>
            <p className="mt-1 text-2xl font-semibold text-navy-900">$5.00</p>
            <p className="mt-1 text-xs text-navy-600">membership activation</p>
          </div>
          <div className="rounded-xl bg-navy-50 p-4 ring-1 ring-navy-200">
            <p className="text-xs uppercase tracking-widest text-navy-500">When you hit $25 earned</p>
            <p className="mt-1 text-2xl font-semibold text-navy-900">–$5.00</p>
            <p className="mt-1 text-xs text-navy-600">credit to your balance</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-2 ring-coral-300">
            <p className="text-xs uppercase tracking-widest text-coral-600">Net cost</p>
            <p className="mt-1 text-2xl font-semibold text-coral-700">$0.00</p>
            <p className="mt-1 text-xs text-navy-600">if you actively use the platform</p>
          </div>
        </div>

        <div className="mt-8 space-y-2 text-sm text-navy-700">
          <p className="flex items-start gap-2">
            <span className="text-coral-500">✓</span>
            <span>Full access to 22+ active brand programs from day one</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-coral-500">✓</span>
            <span>Cancel anytime — no contract, no minimum term</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-coral-500">✓</span>
            <span>Fast-track first $25 cashout lands same-day</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-coral-500">✓</span>
            <span>Direct access to the founder during your first month</span>
          </p>
        </div>

        <div className="mt-8">
          <Link
            href={signupHref}
            onClick={() => fireLPPricingCTAClicked("B")}
            className="btn-primary no-underline"
          >
            Get started — $5 back guarantee
          </Link>
          <p className="mt-3 text-xs text-navy-500">
            $5/mo billed monthly. The $5 credit applies once your cumulative
            earnings cross $25. See full terms at{" "}
            <Link href="/terms" className="underline">
              /terms
            </Link>
            .
          </p>
        </div>
      </div>
    </motion.section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Variant C — Skool-inspired exclusive                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function VariantC({ signupHref }: { signupHref: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-24"
      id="pricing"
    >
      <div className="rounded-3xl bg-white p-8 ring-2 ring-navy-300 sm:p-10">
        <p className="text-xs uppercase tracking-widest text-navy-600 font-semibold">
          $5/month for the door, not the deal
        </p>
        <h2 className="mt-2 text-balance text-3xl text-navy-900 sm:text-4xl">
          The brands inside don&apos;t accept random applicants. The $5 is
          what opens the door.
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-navy-700">
          Most affiliate programs make you apply, prove you have a following,
          and wait a week to hear back. Most moms never get approved. We&apos;ve
          already done that work with 22+ premium brands so you skip the line.
          The $5/mo is your access key to a room you couldn&apos;t walk into
          alone.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-navy-900 p-5 text-white">
            <p className="text-xs uppercase tracking-widest text-coral-300">Without MomFluence</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-navy-400">✗</span>
                <span>Apply to each brand individually</span>
              </li>
              <li className="flex gap-2">
                <span className="text-navy-400">✗</span>
                <span>Wait 1-2 weeks for each approval</span>
              </li>
              <li className="flex gap-2">
                <span className="text-navy-400">✗</span>
                <span>Most reject moms without a following</span>
              </li>
              <li className="flex gap-2">
                <span className="text-navy-400">✗</span>
                <span>Manage payments from each brand separately</span>
              </li>
            </ul>
          </div>
          <div className="rounded-xl bg-coral-50 p-5 ring-2 ring-coral-200">
            <p className="text-xs uppercase tracking-widest text-coral-600">With MomFluence</p>
            <ul className="mt-3 space-y-2 text-sm text-navy-700">
              <li className="flex gap-2">
                <span className="text-coral-500">✓</span>
                <span>22+ brands already approved you</span>
              </li>
              <li className="flex gap-2">
                <span className="text-coral-500">✓</span>
                <span>Generate a tracked link in one click</span>
              </li>
              <li className="flex gap-2">
                <span className="text-coral-500">✓</span>
                <span>No following, no audience requirement</span>
              </li>
              <li className="flex gap-2">
                <span className="text-coral-500">✓</span>
                <span>One dashboard, one payout, all brands</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-navy-50 p-5 ring-1 ring-navy-200">
          <p className="text-sm text-navy-700">
            <span className="font-semibold text-navy-900">Why the $5?</span>{" "}
            Brand partnerships at this quality have minimums and management
            costs. The membership covers the gatekeeping work so members can
            walk straight in. Cancel anytime — but past earnings stay yours
            forever.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href={signupHref}
            onClick={() => fireLPPricingCTAClicked("C")}
            className="btn-primary no-underline"
          >
            Get the keys — $5/mo
          </Link>
          <p className="mt-3 text-xs text-navy-500">
            $5/mo billed monthly. Cancel anytime via the customer portal. See full terms at{" "}
            <Link href="/terms" className="underline">
              /terms
            </Link>
            .
          </p>
        </div>
      </div>
    </motion.section>
  );
}
