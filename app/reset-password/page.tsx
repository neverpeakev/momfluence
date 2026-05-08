"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("redirect", "/dashboard");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo.toString()
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">Reset your password</h1>
      <p className="mt-2 text-navy-600">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      {sent ? (
        <div className="card mt-8 border-l-4 border-coral-500">
          <h3 className="text-lg">Check your email</h3>
          <p className="mt-2 text-sm text-navy-600">
            If <strong>{email}</strong> matches an account, we sent a password-reset link.
            It&apos;s good for 1 hour.
          </p>
        </div>
      ) : (
        <form onSubmit={send} className="mt-8 space-y-4">
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
          {err && <p className="text-sm text-coral-700">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full no-underline">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-10 text-sm text-navy-600">
        Remembered it?{" "}
        <Link href="/login" className="text-coral-600 hover:text-coral-700">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
