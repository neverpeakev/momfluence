"use client";

/**
 * "Continue with Facebook" button — sibling of ContinueWithGoogleButton.
 *
 * Calls supabase.auth.signInWithOAuth({ provider: 'facebook' }), which
 * redirects to Facebook OAuth → Supabase callback → our /auth/callback
 * route (already wired) → /dashboard.
 *
 * Important note: Facebook Login covers BOTH Facebook AND Instagram users
 * with linked accounts. Meta retired the separate "Instagram Basic Display"
 * SSO flow — instagram users sign in via "Continue with Facebook" through
 * their linked Facebook account. There's no separate "Continue with
 * Instagram" button to build.
 *
 * Activation: Facebook Login provider must be enabled in Supabase Auth →
 * Providers → Facebook with the App ID + App Secret from the existing
 * MomFluence Meta app (developers.facebook.com, App ID 2942825449221349).
 * Until then, clicking this button surfaces a Supabase error message.
 *
 * Scopes: we request the default `public_profile,email` which is auto-
 * approved by Meta with no App Review. Anything more (e.g. user_posts,
 * pages_read_engagement) would require App Review which can take weeks.
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** Where to send the user after auth lands. Defaults to /dashboard. */
  redirectTo?: string;
  /** Override button text (differs slightly between signup/login). */
  label?: string;
  /** Optional className appended to the wrapper. */
  className?: string;
}

export default function ContinueWithFacebookButton({
  redirectTo = "/dashboard",
  label = "Continue with Facebook",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("redirect", redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: callback.toString(),
        // public_profile is implicit; email is the one we actually need
        // for Supabase to create the momfluencer record.
        scopes: "email",
      },
    });
    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }
    // OAuth redirect handles the rest; leave loading=true until unload.
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-navy-200 bg-white px-4 py-3 text-base font-medium text-navy-900 transition hover:bg-navy-50 disabled:opacity-60"
      >
        <FacebookLogoIcon />
        <span>{loading ? "Redirecting to Facebook…" : label}</span>
      </button>
      {err && <p className="mt-2 text-sm text-coral-700">{err}</p>}
    </div>
  );
}

/** Inline Facebook "f" mark — official brand color #1877F2, no external asset. */
function FacebookLogoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.027 1.792-4.7 4.533-4.7 1.312 0 2.686.235 2.686.235v2.971h-1.514c-1.491 0-1.956.93-1.956 1.886v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  );
}
