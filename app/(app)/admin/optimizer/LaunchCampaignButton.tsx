"use client";

import { useState } from "react";

interface LaunchResult {
  ok: boolean;
  campaignId?: string;
  adSetId?: string;
  adsCreated?: number;
  ads?: Array<{ creativeId: string; adId: string; variantSlug: string }>;
  warnings?: string[];
  error?: string;
  checks?: Array<{ name: string; ok: boolean; detail?: string }>;
}

export default function LaunchCampaignButton() {
  const [budget, setBudget] = useState("30");
  // Default cost cap raised to $10 (2026-05-15) — see comment in
  // lib/optimizer/campaign-builder.ts:bidAmountCents for rationale.
  const [costCap, setCostCap] = useState("10");
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function launch() {
    if (confirmText !== "LAUNCH") {
      alert('Type "LAUNCH" exactly to confirm.');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/optimizer/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyBudgetUsd: Number(budget),
          costCapUsd: Number(costCap),
          force,
        }),
      });
      const body = (await res.json()) as LaunchResult;
      setResult(body);
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 ring-2 ring-coral-200">
      <h3 className="text-xl text-navy-900">Launch campaign in Meta</h3>
      <p className="mt-2 text-sm text-navy-600">
        Creates a paused campaign + ad set + 10 ads in the configured Meta ad
        account. Ads stay <span className="font-semibold">paused</span> until you
        unpause them in Ads Manager — nothing spends without your final click.
      </p>

      <div className="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <p className="text-sm font-semibold text-amber-900">Pre-flight checklist</p>
        <ul className="mt-2 space-y-1 text-xs text-amber-900">
          <li>→ All 10 PNGs exist at <span className="font-mono">/public/creatives/v1/c11.png</span> through <span className="font-mono">c20.png</span> (1080×1080 each)</li>
          <li>→ Env vars set in Vercel: META_MARKETING_API_TOKEN, META_AD_ACCOUNT_ID, META_FB_PAGE_ID, NEXT_PUBLIC_SITE_URL</li>
          <li>→ Your Facebook Page is connected to the ad account</li>
          <li>→ The v2 Meta Pixel (1468831514190648) is firing Purchase events from /welcome</li>
        </ul>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-navy-700 font-medium">Daily budget (USD)</span>
          <input
            type="number"
            min={5}
            max={5000}
            step={1}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="input mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy-700 font-medium">Cost cap (USD per conversion)</span>
          <input
            type="number"
            min={1}
            max={50}
            step={0.5}
            value={costCap}
            onChange={(e) => setCostCap(e.target.value)}
            className="input mt-1"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-navy-700">
        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
        <span>Force — allow duplicate campaign with same canonical name (advanced)</span>
      </label>

      <div className="mt-5">
        <label className="block text-sm">
          <span className="text-navy-700 font-medium">Type LAUNCH to confirm:</span>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="input mt-1 max-w-xs"
            placeholder="LAUNCH"
          />
        </label>
      </div>

      <button
        onClick={launch}
        disabled={busy || confirmText !== "LAUNCH"}
        className="btn-primary mt-5 disabled:opacity-40"
      >
        {busy ? "Building in Meta…" : "Launch campaign"}
      </button>

      {result && (
        <div className="mt-5 rounded-xl bg-navy-50 p-4 ring-1 ring-navy-100">
          {result.ok ? (
            <>
              <p className="text-sm font-semibold text-emerald-700">✓ Campaign built successfully (paused)</p>
              <p className="mt-2 text-xs text-navy-700">
                Campaign: <span className="font-mono">{result.campaignId}</span> · Ad set:{" "}
                <span className="font-mono">{result.adSetId}</span> · Ads created:{" "}
                <span className="font-semibold">{result.adsCreated}</span>
              </p>
              {result.warnings && result.warnings.length > 0 && (
                <div className="mt-3 rounded bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  <p className="font-semibold">Warnings:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              <p className="mt-3 text-xs text-navy-600">
                Next: open Meta Ads Manager → review → unpause the ad set + ads when ready to start spending.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-coral-700">✗ Launch failed</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-navy-800">{result.error}</pre>
              {result.checks && (
                <ul className="mt-3 space-y-1 text-xs text-navy-700">
                  {result.checks.map((c) => (
                    <li key={c.name}>{c.ok ? "✓" : "✗"} {c.name}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
