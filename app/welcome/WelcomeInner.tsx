"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fireMetaPurchase } from "@/lib/meta-pixel";

const PURCHASE_FIRED_PREFIX = "mf_purchase_fired:";

export default function WelcomeInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!sessionId) return;
    if (typeof window === "undefined") return;

    const key = `${PURCHASE_FIRED_PREFIX}${sessionId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable (rare, e.g. private mode) — fire anyway.
    }

    // Pass a deterministic event_id derived from the Stripe Checkout session id
    // so this browser pixel event dedupes against the server-side CAPI Purchase
    // event fired from the Stripe webhook (see lib/meta-capi.ts).
    const eventId = sessionId ? `purchase_${sessionId}` : undefined;
    fireMetaPurchase(5.0, "USD", eventId);
  }, [sessionId]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">
        You&apos;re a member
      </p>
      <h1 className="mt-3 text-5xl text-navy-900">Welcome in.</h1>
      <p className="mt-6 text-lg text-navy-600">
        Your membership is active. Let&apos;s set up your profile so we can start
        tagging brand links to you.
      </p>

      <div className="mt-6 rounded-xl bg-navy-900 px-5 py-4 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-coral-300">
          Every brand link is live
        </p>
        <p className="mt-2 text-base leading-relaxed">
          No per-brand applications, no waiting on reviews —{" "}
          <span className="font-semibold">your curated affiliate links are
          ready to use right now.</span>
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-coral-50 px-4 py-3 ring-1 ring-coral-200">
        <p className="text-sm text-navy-800">
          <span className="font-semibold text-coral-700">How it works:</span>{" "}
          tag your link to brands, share it where your audience already lives, and
          we pay you commission when someone you sent buys. Hit $25 in earnings
          and you can cash out.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/onboarding/profile" className="btn-primary no-underline">
          Set up profile →
        </Link>
        <Link href="/dashboard" className="btn-ghost no-underline">
          Skip for now
        </Link>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="card">
          <h3 className="text-lg">What&apos;s next</h3>
          <p className="mt-2 text-sm text-navy-600">
            Complete your profile, browse 50+ curated brands, and grab your first tracking
            link.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg">Your first cashout</h3>
          <p className="mt-2 text-sm text-navy-600">
            Earn $25 and you can cash out — paid to PayPal, Venmo, or bank
            transfer. Your fast-track first cashout unlocks day one.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg">Need help?</h3>
          <p className="mt-2 text-sm text-navy-600">
            Email{" "}
            <a href="mailto:hello@momfluence.app" className="text-coral-600">
              hello@momfluence.app
            </a>{" "}
            and we&apos;ll get back to you fast.
          </p>
        </div>
      </div>
    </main>
  );
}
