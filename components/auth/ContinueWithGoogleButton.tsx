"use client";

/**
 * Single "Continue with Google" button used on both /signup and /login.
 *
 * Triggers Supabase Auth's Google OAuth flow. After consent, Google
 * redirects to the Supabase project's /auth/v1/callback, Supabase
 * exchanges the code, then bounces back to /auth/callback in this app
 * which finishes the session and routes to /dashboard (or whatever
 * `redirect` was set to before launch).
 *
 * Voice copy lives here so /signup and /login can't drift apart.
 */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  /** Where to send the user after auth lands. Defaults to /dashboard. */
  redirectTo?: string;
  /** Override button text (defaults differ slightly between signup/login). */
  label?: string;
  /** Optional className appended after the base classes. */
  className?: string;
}

export default function ContinueWithGoogleButton({
  redirectTo = "/dashboard",
  label = "Continue with Google",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    // Construct the post-OAuth callback inside our app. Supabase Auth
    // appends `?code=…` here once it has exchanged the OAuth code with
    // Google. Our /auth/callback route then finalizes the session.
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("redirect", redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        // Always show the Google account chooser, even if the user is
        // already signed in with one Google account — they may want to
        // pick a different one for MomFluence.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }
    // signInWithOAuth() will redirect away from this page; nothing else
    // to do in the success path. Leave loading=true so the button stays
    // disabled until the page unloads.
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-navy-200 bg-white px-4 py-3 text-base font-medium text-navy-900 transition hover:bg-navy-50 disabled:opacity-60"
      >
        <GoogleLogoIcon />
        <span>{loading ? "Redirecting to Google…" : label}</span>
      </button>
      {err && <p className="mt-2 text-sm text-coral-700">{err}</p>}
    </div>
  );
}

/** Inline Google "G" mark — no external asset, no Tailwind dep. */
function GoogleLogoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
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
