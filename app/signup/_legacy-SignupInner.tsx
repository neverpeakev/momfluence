"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  fireMetaEvent,
  fireMetaCompleteRegistration,
  fireMetaInitiateCheckout,
} from "@/lib/meta-pixel";
import {
  parseAttributionFromQuery,
  readAttributionFromCookies,
  writeAttributionToCookies,
  type Attribution,
} from "@/lib/funnel-lab/attribution";
/**
 * Email/password fallback embedded inside ApplyHero's "Other ways to apply"
 * disclosure. Renders ONLY the application form (no hero copy, no SSO — those
 * are owned by ApplyHero itself so we don't duplicate them inside the disclosure).
 *
 * On submit: creates the Supabase user, fires CompleteRegistration in browser
 * + CAPI, then posts to /api/checkout/create with the application payload
 * (instagram, tiktok, why, geo) and redirects to Stripe Checkout.
 */

type Geo = "us" | "ca" | "other";

export default function SignupInner() {
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [why, setWhy] = useState("");
  const [geo, setGeo] = useState<Geo>("us");
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attr, setAttr] = useState<Attribution>({});

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
    // AddToCart is fired by the parent ApplyHero on mount — don't double-fire here.
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

  // Strip @ prefix if user pasted it from their bio, normalize lowercase.
  function normHandle(s: string): string {
    return s.trim().replace(/^@/, "").toLowerCase();
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
    if (!instagram && !tiktok) {
      setErr("Please enter at least one social handle (Instagram or TikTok) so we know where you post.");
      return;
    }
    if (why.trim().length < 20) {
      setErr("Tell us a little more about why you want to join — at least one full sentence.");
      return;
    }
    if (!agreed) {
      setErr("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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

    fireMetaCompleteRegistration(signUpData.user?.id);
    fireMetaEvent("SignupStarted", { content_name: "MomFluence Application" });

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attribution: attr,
          application: {
            instagram_handle: instagram ? normHandle(instagram) : null,
            tiktok_handle: tiktok ? normHandle(tiktok) : null,
            why: why.trim(),
            geo,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Application checkout failed (${res.status})`);
      }
      const { url } = await res.json();
      if (!url) throw new Error("Checkout URL missing");
      fireMetaInitiateCheckout();
      window.location.href = url;
    } catch (e) {
      setLoading(false);
      const message = e instanceof Error ? e.message : "Could not submit your application.";
      setErr(`${message} Your account was created — try signing in to resume.`);
    }
  }

  return (
    <div className="px-6 sm:px-0">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="border-t border-navy-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">
            About you
          </p>

          <div className="mt-3">
            <label className="label" htmlFor="instagram">Instagram handle</label>
            <input
              id="instagram"
              type="text"
              autoComplete="off"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="input"
              placeholder="@momof2andcounting"
            />
          </div>

          <div className="mt-3">
            <label className="label" htmlFor="tiktok">TikTok handle</label>
            <input
              id="tiktok"
              type="text"
              autoComplete="off"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="input"
              placeholder="@momof2andcounting"
            />
            <p className="mt-1 text-xs text-navy-500">
              One social is required — Instagram or TikTok. Both is even better.
            </p>
          </div>

          <div className="mt-3">
            <label className="label" htmlFor="geo">Where are you based?</label>
            <select
              id="geo"
              value={geo}
              onChange={(e) => setGeo(e.target.value as Geo)}
              className="input"
            >
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="label" htmlFor="why">
              Why do you want to join? <span className="text-coral-600">*</span>
            </label>
            <textarea
              id="why"
              required
              rows={3}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="input resize-y"
              placeholder="e.g. I'm a stay-at-home mom of 3 looking to earn $200-500/mo around naptime. I already share product recommendations to my friends — I just want to get paid for it."
            />
            <p className="mt-1 text-xs text-navy-500">
              We read every application. One real sentence is plenty.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-navy-700 pt-2">
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
            . I understand my $5 deposit is refunded if I&apos;m not accepted,
            and credited to my first payout if I am.
          </span>
        </label>

        {err && <p className="text-sm text-coral-700">{err}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full no-underline">
          {loading ? "Submitting…" : "Apply with email — $5"}
        </button>
        <p className="text-center text-xs text-navy-500">
          $5 refunded in full if not approved. Otherwise it covers month one.
        </p>
      </form>
    </div>
  );
}
