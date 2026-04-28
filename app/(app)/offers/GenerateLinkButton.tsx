"use client";

import { useState } from "react";

export default function GenerateLinkButton({ offerId, offerSlug }: { offerId: string; offerSlug: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, label: null })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setLink(j.shortUrl);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  if (link) {
    return (
      <div className="text-right">
        <input
          readOnly
          value={link}
          className="input text-xs w-64"
          onFocus={(e) => e.currentTarget.select()}
        />
        <p className="text-xs text-navy-500 mt-1">Tap to copy. Logged under My links.</p>
      </div>
    );
  }
  return (
    <div className="text-right">
      <button onClick={go} disabled={loading} className="btn-primary">
        {loading ? "…" : "Get my link"}
      </button>
      {err && <p className="text-xs text-coral-700 mt-1">{err}</p>}
    </div>
  );
}
