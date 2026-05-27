"use client";

/**
 * /signup hero — the new primary signup surface (added 2026-05-27).
 *
 * Replaces the legacy SignupInner.tsx (preserved as _legacy-SignupInner.tsx
 * for the disclosure). Designed for mobile-first conversion:
 *   - Single-screen hero, everything above the fold
 *   - Apple Pay + Google Pay buttons as primary CTAs
 *   - "Other ways to apply" disclosure for card / OAuth / email-password
 *
 * Voice: welcoming, aligned with the "everyday moms get paid like influencers"
 * ad voice. NOT the old "we don't accept everyone" selective framing —
 * application step is a quick realness check, refund is automatic.
 *
 * Flow:
 *   1. User taps Apple Pay or Google Pay button
 *   2. POST /api/apply/start → returns Stripe Checkout URL
 *   3. window.location → Stripe-hosted Checkout (rendered at
 *      checkout.momfluence.app via Stripe Custom Domain)
 *   4. Apple Pay / Google Pay / Card shown on Stripe's page
 *   5. Pay → Stripe redirects to /signup/success
 *   6. /signup/success sends magic-link email → user clicks → /onboarding
 *
 * The "Other ways to apply" disclosure renders the legacy OAuth + email-password
 * flow for users who prefer that path (and as a fallback while the Supabase
 * PKCE OAuth bug is being investigated separately).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  parseAttributionFromQuery,
  readAttributionFromCookies,
  writeAttributionToCookies,
  type Attribution,
} from "@/lib/funnel-lab/attribution";
import { fireMetaAddToCart, fireMetaInitiateCheckout } from "@/lib/meta-pixel";
import LegacySignupInner from "./_legacy-SignupInner";

export default function ApplyHero() {
  const sp = useSearchParams();
  const cancelled = sp.get("cancelled") === "1";
  const [loading, setLoading] = useState<null | "apple" | "google" | "card">(
    null
  );
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

  async function startApply(method: "apple" | "google" | "card") {
    setErr(null);
    setLoading(method);
    try {
      const res = await fetch("/api/apply/start", {
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
      const message =
        e instanceof Error ? e.message : "Could not start checkout.";
      setErr(message);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
      {/* Hero — mobile-first, no scroll needed to see the apply CTAs */}
      <h1 className="text-4xl text-navy-900 leading-tight sm:text-5xl">
        Apply to join MomFluence
      </h1>
      <p className="mt-3 text-base text-navy-700 sm:text-lg">
        Get paid for sharing recs you&apos;d give anyway.
      </p>
      <p className="mt-2 text-sm text-navy-600">
        $5 to apply — refunded in full if not approved. If approved, your $5
        covers month one at $5/mo.
      </p>

      {cancelled && (
        <p className="mt-4 rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-700">
          No charge — you cancelled at the payment step. Try again when you&apos;re
          ready.
        </p>
      )}

      {/* Primary CTAs — Apple Pay + Google Pay branded buttons.
          Both route to the same Stripe Checkout Session; Stripe's page
          (rendered at checkout.momfluence.app) shows Apple Pay / Google Pay /
          card based on the user's device. */}
      <div className="mt-7 space-y-3">
        <ApplyApplePayButton
          loading={loading === "apple"}
          disabled={loading !== null}
          onClick={() => startApply("apple")}
        />
        <ApplyGooglePayButton
          loading={loading === "google"}
          disabled={loading !== null}
          onClick={() => startApply("google")}
        />
      </div>

      {err && <p className="mt-4 text-sm text-coral-700">{err}</p>}

      {/* Disclosure — card form, OAuth, email/password. All routes available
          but hidden by default so the hero stays clean. */}
      <details className="mt-6 group">
        <summary className="cursor-pointer list-none text-sm font-medium text-navy-700 hover:text-navy-900 select-none">
          <span className="inline-flex items-center gap-1">
            Other ways to apply
            <ChevronIcon />
          </span>
        </summary>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => startApply("card")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-navy-200 bg-white px-4 py-3 text-base font-medium text-navy-900 transition hover:bg-navy-50 disabled:opacity-60"
          >
            <CardIcon />
            <span>{loading === "card" ? "Opening…" : "Apply with credit card"}</span>
          </button>

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-navy-400">
            <span className="h-px flex-1 bg-navy-100" />
            <span>or sign up first</span>
            <span className="h-px flex-1 bg-navy-100" />
          </div>

          {/* Legacy SignupInner — full form + OAuth. Kept inside this
              disclosure so the hero stays focused. */}
          <div className="-mx-6 sm:mx-0">
            <LegacySignupInner />
          </div>
        </div>
      </details>

      <p className="mt-10 text-xs text-navy-500">
        Already have an account?{" "}
        <Link href="/login" className="text-coral-600 hover:text-coral-700">
          Sign in
        </Link>
      </p>

      {(attr.variant || attr.creative) && (
        <p className="mt-2 text-[10px] text-navy-400">
          Funnel attribution · variant: {attr.variant ?? "—"} · creative:{" "}
          {attr.creative ?? "—"}
        </p>
      )}
    </main>
  );
}

interface ButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

function ApplyApplePayButton({ loading, disabled, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-black px-5 py-4 text-base font-semibold text-white transition hover:bg-navy-900 disabled:opacity-60"
      aria-label="Apply with Apple Pay"
    >
      <AppleLogo />
      <span>{loading ? "Opening…" : "Apply with Apple Pay"}</span>
    </button>
  );
}

function ApplyGooglePayButton({ loading, disabled, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-white border border-navy-300 px-5 py-4 text-base font-semibold text-navy-900 transition hover:bg-navy-50 disabled:opacity-60"
      aria-label="Apply with Google Pay"
    >
      <GooglePayLogo />
      <span>{loading ? "Opening…" : "Apply with Google Pay"}</span>
    </button>
  );
}

function AppleLogo() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 384 512"
      fill="currentColor"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GooglePayLogo() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706a5.41 5.41 0 0 1-.282-1.706c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="transition-transform group-open:rotate-180"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
