"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ContinueWithGoogleButton from "@/components/auth/ContinueWithGoogleButton";
// Facebook SSO temporarily disabled — Meta App Review in progress for email + public_profile
// permissions on the MomFluence Sign-In Consumer app (App ID 2762454974126506). The OAuth flow
// works end-to-end but the consent screen rejects with "Sorry, something went wrong" because
// Meta hasn't yet activated those permissions on the new app. Cron job e4e2799e is polling the
// Graph API /permissions endpoint every 15 min — when email + public_profile flip to status="live",
// uncomment the import + JSX block below and ship a follow-up PR to re-enable the button.
// import ContinueWithFacebookButton from "@/components/auth/ContinueWithFacebookButton";

type Mode = "password" | "magic";

export default function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const initialErr = params.get("err");

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [err, setErr] = useState<string | null>(initialErr);
  const [loading, setLoading] = useState(false);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("redirect", redirect);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: false }
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setMagicSent(true);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">Sign in</h1>
      <p className="mt-2 text-navy-600">Welcome back to MomFluence.</p>

      {magicSent ? (
        <div className="card mt-8 border-l-4 border-coral-500">
          <h3 className="text-lg">Check your email</h3>
          <p className="mt-2 text-sm text-navy-600">
            We sent a sign-in link to <strong>{email}</strong>. It&apos;s good for 1 hour.
          </p>
        </div>
      ) : (
        <>
          <ContinueWithGoogleButton
            redirectTo={redirect}
            label="Sign in with Google"
            className="mt-8"
          />
          {/* Facebook SSO temporarily hidden pending Meta App Review (App ID 2762454974126506).
              Re-enable when Graph API /permissions returns email + public_profile with status="live".
          <ContinueWithFacebookButton
            redirectTo={redirect}
            label="Sign in with Facebook"
            className="mt-3"
          />
          */}
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-navy-400">
            <span className="h-px flex-1 bg-navy-100" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-navy-100" />
          </div>
          {mode === "password" ? (
        <form onSubmit={signInWithPassword} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>
          {err && <p className="text-sm text-coral-700">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full no-underline">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <Link href="/reset-password" className="text-navy-600 no-underline hover:text-navy-900">
              Forgot password?
            </Link>
            <button
              type="button"
              onClick={() => { setErr(null); setMode("magic"); }}
              className="text-navy-600 hover:text-navy-900"
            >
              Use a magic link instead
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email-magic">Email</label>
            <input
              id="email-magic"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          {err && <p className="text-sm text-coral-700">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full no-underline">
            {loading ? "Sending…" : "Send magic link"}
          </button>
          <div className="text-right text-sm">
            <button
              type="button"
              onClick={() => { setErr(null); setMode("password"); }}
              className="text-navy-600 hover:text-navy-900"
            >
              Use a password instead
            </button>
          </div>
        </form>
          )}
        </>
      )}

      <p className="mt-10 text-sm text-navy-600">
        New here?{" "}
        <Link href="/signup" className="text-coral-600 hover:text-coral-700">
          Join $5/mo
        </Link>
      </p>
    </main>
  );
}
