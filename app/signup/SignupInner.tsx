"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fireMetaEvent } from "@/lib/meta-pixel";
import {
  parseAttributionFromQuery,
  readAttributionFromCookies,
  writeAttributionToCookies,
  type Attribution,
} from "@/lib/funnel-lab/attribution";

export default function SignupInner() {
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attr, setAttr] = useState<Attribution>({});

  // On mount: merge URL params with cookie, persist the merge so checkout API picks it up.
  // pricing_variant is set server-side in <LPBaseline /> as mf_pricing_variant
  // cookie (90-day max-age) — we read it here directly off document.cookie
  // since it's NOT part of the mf_lp/mf_creative attribution cookies.
  useEffect(() => {
    const fromUrl = parseAttributionFromQuery(sp);
    const fromCookie = readAttributionFromCookies();
    const pricingFromCookie = readPricingVariantCookie();
    const merged: Attribution = {
      variant: fromUrl.variant ?? fromCookie.variant,
      creative: fromUrl.creative ?? fromCookie.creative,
      firstSeen: fromCookie.firstSeen ?? new Date().toISOString(),
      pricingVariant: fromUrl.pricingVariant ?? pricingFromCookie ?? undefined,
    };
    writeAttributionToCookies(merged);
    setAttr(merged);
  }, [sp]);

  function readPricingVariantCookie(): "B" | "C" | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("mf_pricing_variant="));
    if (!match) return null;
    const raw = decodeURIComponent(match.split("=")[1] ?? "");
    return raw === "B" || raw === "C" ? raw : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email || !password) {
      setErr("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    if (!agreed) {
      setErr("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        setErr("You already have an account with that email. Try signing in instead.");
      } else {
        setErr(signUpError.message);
      }
      return;
    }

    fireMetaEvent("SignupStarted", { content_name: "MomFluence Membership" });

    try {
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
      window.location.href = url;
    } catch (e) {
      setLoading(false);
      const message = e instanceof Error ? e.message : "Could not start checkout.";
      setErr(`${message} Your account was created — try signing in and starting checkout from there.`);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">Join MomFluence — $5/mo</h1>
      <p className="mt-2 text-navy-600">
        Create your account, then complete checkout. You can cancel anytime.
      </p>

      <div className="mt-6 rounded-xl bg-coral-50 px-4 py-3 ring-1 ring-coral-200">
        <p className="text-sm text-navy-800">
          <span className="font-semibold text-coral-700">Heads up:</span> an
          active <span className="font-semibold">$5/mo membership</span> is
          required to earn commissions on your tracked links. If your membership
          lapses, earnings pause until you reactivate. Cancel anytime.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            placeholder="Type it again"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-coral-600 hover:text-coral-700">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-coral-600 hover:text-coral-700">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {err && <p className="text-sm text-coral-700">{err}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full no-underline">
          {loading ? "Creating account…" : "Continue to checkout"}
        </button>

        {(attr.variant || attr.creative) && (
          <p className="text-[10px] text-navy-400">
            Funnel attribution captured · variant: {attr.variant ?? "—"} · creative: {attr.creative ?? "—"}
          </p>
        )}
      </form>

      <p className="mt-10 text-sm text-navy-600">
        Already have an account?{" "}
        <Link href="/login" className="text-coral-600 hover:text-coral-700">
          Sign in
        </Link>
      </p>
    </main>
  );
}
