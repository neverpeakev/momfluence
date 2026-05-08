"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fireMetaPurchase } from "@/lib/meta-pixel";

const PURCHASE_FIRED_PREFIX = "mf_purchase_fired:";

export default function WelcomePage() {
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

    // Stape CAPIG mirrors this server-side automatically; no event_id needed.
    fireMetaPurchase(5.0, "USD");
  }, [sessionId]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-coral-600 font-semibold">
        Welcome
      </p>
      <h1 className="mt-3 text-5xl text-navy-900">You&apos;re in!</h1>
      <p className="mt-6 text-lg text-navy-600">
        Your $5/mo membership is active. Let&apos;s get your profile set up so we can start
        tagging links to you.
      </p>

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
          <h3 className="text-lg">Your first $25</h3>
          <p className="mt-2 text-sm text-navy-600">
            Every new member gets one fast-track payout in their first 90 days. Earn $25 and
            you can cash out.
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
