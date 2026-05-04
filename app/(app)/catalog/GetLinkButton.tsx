"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GetLinkButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, label: null })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `request failed (${r.status})`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={go} disabled={loading} className="btn-primary w-full">
        {loading ? "Getting link…" : "Get link"}
      </button>
      {err && <p className="mt-2 text-xs text-coral-700">{err}</p>}
    </div>
  );
}
