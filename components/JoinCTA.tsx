"use client";

import { useState } from "react";

type Props = {
  label?: string;
  className?: string;
  variant?: "primary" | "ghost";
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function JoinCTA({ label = "Join $5/mo", className = "", variant = "primary" }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setErr(null);
    setLoading(true);
    try {
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("trackSingle", "1468831514190648", "CheckoutStarted");
      }
      const res = await fetch("/api/checkout/create", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string })?.error || `Checkout failed (${res.status})`);
      }
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("Checkout URL missing");
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  const cls = variant === "ghost" ? "btn-ghost" : "btn-primary";

  return (
    <span className="inline-flex flex-col">
      <button onClick={start} disabled={loading} className={`${cls} ${className}`} type="button">
        {loading ? "Loading…" : label}
      </button>
      {err && <span className="mt-2 text-xs text-coral-700">{err}</span>}
    </span>
  );
}
