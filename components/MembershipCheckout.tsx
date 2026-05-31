"use client";

/**
 * MembershipCheckout — the single conversion unit for the whole funnel.
 *
 * Renders Apple Pay + Google Pay as primary one-tap buttons and a "Pay with
 * card" reveal underneath (secondary, so card-entry doesn't scare wallet-ready
 * users). All three POST to /api/checkout/start and redirect to Stripe Checkout
 * (mode=subscription, $5/mo), where the matching wallet sheet / card form
 * renders natively on Stripe's own domain.
 *
 * Used on both the homepage hero and /signup so there's exactly one checkout
 * code path. Fires Meta AddToCart on mount (reaching the CTA = intent) and
 * InitiateCheckout on click (committing to pay).
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  parseAttributionFromQuery,
  readAttributionFromCookies,
  writeAttributionToCookies,
  type Attribution,
} from "@/lib/funnel-lab/attribution";
import { fireMetaAddToCart, fireMetaInitiateCheckout } from "@/lib/meta-pixel";

type Method = "apple" | "google" | "card";

export default function MembershipCheckout({
  className = "",
}: {
  className?: string;
}) {
  const sp = useSearchParams();
  const [loading, setLoading] = useState<Method | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attr, setAttr] = useState<Attribution>({});

  useEffect(() => {
    const fromUrl = parseAttributionFromQuery(sp);
    const fromCookie = readAttributionFromCookies();
    const merged: Attribution = {
      variant: fromUrl.variant ?? fromCookie.variant,
      creative: fromUrl.creative ?? fromCookie.creative,
      firstSeen: fromCookie.firstSeen ?? new Date().toISOString(),
      pricingVariant: fromUrl.pricingVariant ?? fromCookie.pricingVariant,
    };
    writeAttributionToCookies(merged);
    setAttr(merged);
    fireMetaAddToCart();
  }, [sp]);

  async function start(method: Method) {
    setErr(null);
    setLoading(method);
    try {
      const res = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attribution: attr }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Could not start checkout (${res.status})`);
      }
      const { url } = await res.json();
      if (!url) throw new Error("Checkout URL missing");
      fireMetaInitiateCheckout();
      window.location.href = url;
    } catch (e) {
      setLoading(null);
      setErr(e instanceof Error ? e.message : "Could not start checkout.");
    }
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => start("apple")}
          disabled={loading !== null}
          aria-label="Join with Apple Pay"
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-black px-5 py-4 text-base font-semibold text-white transition hover:bg-navy-900 disabled:opacity-60"
        >
          <AppleLogo />
          <span>{loading === "apple" ? "Opening…" : "Join with Apple Pay"}</span>
        </button>
        <button
          type="button"
          onClick={() => start("google")}
          disabled={loading !== null}
          aria-label="Join with Google Pay"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-navy-300 bg-white px-5 py-4 text-base font-semibold text-navy-900 transition hover:bg-navy-50 disabled:opacity-60"
        >
          <GooglePayLogo />
          <span>{loading === "google" ? "Opening…" : "Join with Google Pay"}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => start("card")}
        disabled={loading !== null}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-navy-600 transition hover:bg-navy-50 hover:text-navy-900 disabled:opacity-60"
      >
        <CardIcon />
        <span>{loading === "card" ? "Opening…" : "Pay with card instead"}</span>
      </button>

      {err && <p className="mt-3 text-sm text-coral-700">{err}</p>}

      <p className="mt-3 text-center text-xs text-navy-500">
        Secure checkout by Stripe · cancel anytime
      </p>
    </div>
  );
}

function AppleLogo() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GooglePayLogo() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706a5.41 5.41 0 0 1-.282-1.706c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
