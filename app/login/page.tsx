"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const redirect = new URL("/auth/callback", window.location.origin).toString();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect, shouldCreateUser: true }
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">Sign in</h1>
      <p className="mt-2 text-navy-600">We'll email you a magic link. No password.</p>

      {sent ? (
        <div className="card mt-8 border-l-4 border-coral-500">
          <h3 className="text-lg">Check your email</h3>
          <p className="mt-2 text-sm text-navy-600">We sent a sign-in link to <strong>{email}</strong>. It's good for 1 hour.</p>
        </div>
      ) : (
        <form onSubmit={send} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          {err && <p className="text-sm text-coral-700">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}
    </main>
  );
}
