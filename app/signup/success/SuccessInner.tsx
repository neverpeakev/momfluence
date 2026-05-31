"use client";

/**
 * /signup/success client component. Triggers the magic-link email and shows
 * "check your inbox" UX.
 *
 * Why signInWithOtp here (and not in the webhook):
 *   - Stays out of the broken Supabase OAuth/PKCE path entirely
 *   - signInWithOtp uses /auth/v1/otp which sends a magic link to /auth/v1/verify
 *     (totally separate code path from /auth/v1/callback that's broken)
 *   - Supabase's built-in SMTP sends the email automatically — no third-party
 *     email service needed
 *   - Idempotent: if the user already exists (e.g. webhook beat us to it),
 *     signInWithOtp just sends them a sign-in link instead of creating
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fireMetaEvent } from "@/lib/meta-pixel";

interface Props {
  email: string | null;
  paid: boolean;
}

type Phase = "sending" | "sent" | "error" | "unpaid";

export default function SuccessInner({ email, paid }: Props) {
  const [phase, setPhase] = useState<Phase>("sending");
  const [err, setErr] = useState<string | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (!paid) {
      setPhase("unpaid");
      return;
    }
    if (!email) {
      setErr(
        "We couldn't read your email from the payment. Check your inbox — Stripe sends a receipt that includes a sign-in link."
      );
      setPhase("error");
      return;
    }

    void send();

    async function send() {
      const supabase = createClient();
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email!,
          options: {
            emailRedirectTo: "https://momfluence.app/welcome",
            // Do NOT shouldCreateUser=false — we DO want it to create the user
            // if the webhook hasn't yet (race condition safety).
          },
        });
        if (error) {
          setErr(error.message);
          setPhase("error");
          return;
        }
        // CompleteRegistration is Meta's canonical "user finished signup" event;
        // for our magic-link flow the email confirmation IS registration.
        fireMetaEvent("CompleteRegistration", { content_name: "ApplySuccess" });
        setPhase("sent");
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not send sign-in email.";
        setErr(message);
        setPhase("error");
      }
    }
  }, [email, paid]);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      {phase === "unpaid" && (
        <>
          <h1 className="text-3xl text-navy-900 leading-tight">
            Payment not completed
          </h1>
          <p className="mt-3 text-base text-navy-700">
            Your Stripe Checkout session didn&apos;t complete payment. No
            charge was made.
          </p>
          <div className="mt-6">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-coral-600 px-5 py-3 font-medium text-white no-underline transition hover:bg-coral-700"
            >
              Try again
            </Link>
          </div>
        </>
      )}

      {phase === "sending" && (
        <>
          <h1 className="text-3xl text-navy-900 leading-tight">
            Payment received — sending your sign-in link…
          </h1>
          <p className="mt-3 text-base text-navy-700">
            Just a sec.
          </p>
        </>
      )}

      {phase === "sent" && (
        <>
          <h1 className="text-3xl text-navy-900 leading-tight">
            Check your inbox
          </h1>
          <p className="mt-3 text-base text-navy-700">
            We sent a sign-in link to{" "}
            <span className="font-semibold text-navy-900">{email}</span>.
            Click it to finish setting up your account and get to your
            dashboard.
          </p>
          <p className="mt-3 text-sm text-navy-500">
            Tip: the email arrives within a minute. Check spam if it doesn&apos;t
            show up. Sender is <code>noreply@mail.app.supabase.io</code>.
          </p>
          <div className="mt-8 rounded-2xl bg-navy-50 px-5 py-4 text-sm text-navy-700">
            <p className="font-semibold text-navy-900">What&apos;s next</p>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Open the email and click the sign-in link</li>
              <li>Land on your welcome page — your membership is active</li>
              <li>Set up your profile and grab your first brand link</li>
              <li>Share it, earn commission, cash out at $25</li>
              <li>Cancel anytime in one click from your dashboard</li>
            </ol>
          </div>
        </>
      )}

      {phase === "error" && (
        <>
          <h1 className="text-3xl text-navy-900 leading-tight">
            Almost done — small hiccup
          </h1>
          <p className="mt-3 text-base text-coral-700">{err}</p>
          <p className="mt-3 text-sm text-navy-700">
            Your payment went through. Email us at{" "}
            <a
              href="mailto:hi@momfluence.app"
              className="text-coral-600 hover:text-coral-700"
            >
              hi@momfluence.app
            </a>{" "}
            from{" "}
            <span className="font-semibold">{email ?? "your email"}</span> and
            we&apos;ll finish setup manually within a few hours.
          </p>
        </>
      )}
    </main>
  );
}
