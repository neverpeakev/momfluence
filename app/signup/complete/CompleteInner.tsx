"use client";

/**
 * Post-OAuth checkout trigger. See ./page.tsx for the high-level
 * rationale. This component runs ONCE on mount and either:
 *
 *   a) Bounces to /dashboard if the user already has an active Stripe
 *      subscription (already paid). Prevents double-charging.
 *
 *   b) Posts to /api/checkout/create with the same attribution payload
 *      SignupInner.tsx uses, then redirects to the Stripe URL. Fires
 *      Meta SignupStarted + InitiateCheckout in the same order as the
 *      email+password flow so the funnel signal stays consistent.
 *
 *   c) Surfaces an error message + link back to /signup if any step
 *      fails. The Supabase account is already created at this point,
 *      so the user can also use /login to come back later.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fireMetaEvent,
  fireMetaCompleteRegistration,
  fireMetaInitiateCheckout,
} from "@/lib/meta-pixel";
import { readAttributionFromCookies } from "@/lib/funnel-lab/attribution";

type Phase = "checking" | "starting_checkout" | "error";

export default function CompleteInner() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [err, setErr] = useState<string | null>(null);
  // useRef firedRef so React Strict Mode's double-mount in dev doesn't
  // fire two checkout sessions or two Meta events.
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    void run();

    async function run() {
      const supabase = createClient();

      // 1. Confirm Supabase session — paranoia check, /auth/callback
      //    already exchanged the OAuth code by the time we're here.
      const {
        data: { user },
        error: sessionErr,
      } = await supabase.auth.getUser();
      if (sessionErr || !user) {
        setErr(
          "We couldn't read your account after sign-in. Try clicking the Google or Facebook button again."
        );
        setPhase("error");
        return;
      }

      // 2. Check if this momfluencer already has an active membership.
      //    The momfluencers table has the user's membership state; if their
      //    subscription is already active, send them to dashboard so we
      //    don't open a second checkout session.
      //
      //    The Stripe webhook sets membership_status = 'active' on
      //    checkout.session.completed and 'inactive' on cancellation
      //    (see app/api/stripe/webhook/route.ts). There's no separate
      //    'trialing' state in this column today — Stripe trial subs
      //    still map to 'active' here since the underlying subscription
      //    is in good standing.
      try {
        const { data: m } = await supabase
          .from("momfluencers")
          .select("membership_status")
          .eq("id", user.id)
          .maybeSingle();
        if (m?.membership_status === "active") {
          window.location.replace("/dashboard");
          return;
        }
      } catch {
        // If the read fails (RLS denial, network blip, etc.), err on the
        // side of starting checkout — worst case the Stripe webhook +
        // dashboard gate catch the duplicate.
      }

      // 3. Fire Meta CompleteRegistration + SignupStarted + start Stripe
      //    checkout. CompleteRegistration is the mid-funnel signal the
      //    COMPLETE_REGISTRATION-optimized ad set is built around; without
      //    it Meta has nothing to learn against during the early weeks before
      //    Purchase events accumulate. SignupStarted is our internal/custom
      //    event for funnel-step analytics. Same firing shape as
      //    SignupInner.handleSubmit() for consistency.
      setPhase("starting_checkout");
      fireMetaCompleteRegistration(user.id);
      fireMetaEvent("SignupStarted", { content_name: "MomFluence Application" });

      const attr = readAttributionFromCookies();
      try {
        // OAuth flow: we don't have application fields (instagram/tiktok/why/geo)
        // from the OAuth handshake — they'll fill those in after acceptance on
        // the profile page. For now we just submit the bare application.
        // TODO V2: surface a mini-application form on /signup/complete before
        // the Stripe redirect to collect socials + why.
        const res = await fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attribution: attr }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Checkout failed (${res.status})`);
        }
        const { url } = await res.json();
        if (!url) throw new Error("Checkout URL missing");
        fireMetaInitiateCheckout();
        window.location.href = url;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not start checkout.";
        setErr(
          `${message} Your account was created — head to /login and we'll resume checkout from there.`
        );
        setPhase("error");
      }
    }
  }, []);

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">
        {phase === "error" ? "Couldn't finish application" : "Almost there…"}
      </h1>
      <p className="mt-3 text-base text-navy-700">
        {phase === "checking" && "Reading your account…"}
        {phase === "starting_checkout" &&
          "Account ready — sending you to apply ($5, refunded if not approved)."}
        {phase === "error" && err}
      </p>
      {phase === "error" && (
        <div className="mt-6 flex gap-3">
          <Link href="/signup" className="btn-primary no-underline">
            Try again
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-navy-200 bg-white px-5 py-3 font-medium text-navy-900 no-underline transition hover:bg-navy-50"
          >
            Go to login
          </Link>
        </div>
      )}
    </main>
  );
}
