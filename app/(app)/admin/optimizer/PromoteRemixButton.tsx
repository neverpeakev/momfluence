"use client";

import { useState } from "react";

interface Props {
  actionId: string;
  candidateIndex: number;
  candidateAngle: string;
  candidateHeadline: string;
}

export default function PromoteRemixButton({
  actionId,
  candidateIndex,
  candidateAngle,
  candidateHeadline,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; url?: string } | null>(null);

  async function promote() {
    const confirmed = window.confirm(
      `Promote this remix to a live ad?\n\nAngle: ${candidateAngle}\nHeadline: ${candidateHeadline.slice(0, 100)}\n\nThis will:\n  • Insert a new variant in Supabase\n  • Render its image via Playwright\n  • Create a NEW PAUSED ad in the existing campaign\n\nThe new ad will not spend until you unpause it in Meta Ads Manager.`
    );
    if (!confirmed) return;

    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/optimizer/promote-remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, candidateIndex }),
      });
      const body = await res.json();
      if (res.ok) {
        setResult({
          ok: true,
          message: `Promoted as ${body.promotedVariantSlug}. Ad id: ${body.metaAdId ?? "(no ad created — see warning)"}`,
          url: body.landingPageUrl,
        });
      } else {
        setResult({ ok: false, message: body.error ?? "Unknown error" });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        onClick={promote}
        disabled={busy}
        className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {busy ? "Promoting…" : "Promote to live ad"}
      </button>
      {result && (
        <span className={`text-xs ${result.ok ? "text-emerald-700" : "text-coral-700"}`}>
          {result.message}
          {result.url && (
            <a href={result.url} target="_blank" rel="noreferrer" className="ml-2 underline">
              open LP →
            </a>
          )}
        </span>
      )}
    </div>
  );
}
