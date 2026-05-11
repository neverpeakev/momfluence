"use client";

import { useState } from "react";

type Scenario = "smoke" | "synthetic_clear_winner" | "synthetic_clear_loser" | "synthetic_no_signal" | "real";

interface Check {
  step: string;
  ok: boolean;
  ms: number;
  detail?: Record<string, unknown>;
  error?: string;
}

interface SimulationResponse {
  ok: boolean;
  scenario: Scenario;
  totalMs: number;
  tickId: string | null;
  checks: Check[];
  decisionSummary?: { pause: number; scale: number; remix: number; no_op: number };
  viewInAdmin: string;
  summary: string;
}

interface PagesResponse {
  ok: boolean;
  pages_total: number;
  pages_ads_eligible: number;
  pages: Array<{ id: string; name: string; category?: string; canAdvertise: boolean }>;
  error?: string;
}

const SCENARIOS: { id: Scenario; label: string; description: string }[] = [
  { id: "synthetic_clear_winner", label: "Clear winner", description: "Variant 0 outperforms 4× — exercises SCALE + REMIX paths (calls Anthropic)" },
  { id: "synthetic_clear_loser", label: "Clear loser", description: "Variant 0 tanks at 10% baseline — exercises PAUSE path" },
  { id: "synthetic_no_signal", label: "No signal", description: "All arms roughly equal — exercises no-op path (decisions wait for more data)" },
  { id: "smoke", label: "Smoke (connectivity only)", description: "Just hit every external API, no decisions, no Anthropic, no audit writes" },
  { id: "real", label: "Real data", description: "Use whatever is actually in Stripe + Meta (likely zero on day 1)" },
];

export default function SimulationPanel() {
  const [scenario, setScenario] = useState<Scenario>("synthetic_clear_winner");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [pages, setPages] = useState<PagesResponse | null>(null);
  const [pagesBusy, setPagesBusy] = useState(false);

  async function runSimulation() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/optimizer/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const body = (await res.json()) as SimulationResponse;
      setResult(body);
    } catch (e) {
      setResult({
        ok: false,
        scenario,
        totalMs: 0,
        tickId: null,
        checks: [{ step: "client_request", ok: false, ms: 0, error: e instanceof Error ? e.message : String(e) }],
        viewInAdmin: "/admin/optimizer",
        summary: "Request failed before reaching the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function detectPage() {
    setPagesBusy(true);
    setPages(null);
    try {
      const res = await fetch("/api/optimizer/detect-page");
      setPages(await res.json());
    } catch (e) {
      setPages({
        ok: false,
        pages_total: 0,
        pages_ads_eligible: 0,
        pages: [],
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPagesBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page detection */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-navy-100">
        <h2 className="text-lg text-navy-900">Detect Facebook Page</h2>
        <p className="mt-1 text-sm text-navy-600">
          Lists the Facebook Pages your Meta access token can run ads from. Copy the Page ID into Vercel env as <span className="font-mono">META_FB_PAGE_ID</span>.
        </p>
        <button
          onClick={detectPage}
          disabled={pagesBusy}
          className="btn-ghost mt-4 disabled:opacity-50"
        >
          {pagesBusy ? "Querying Meta…" : "Detect Pages"}
        </button>
        {pages && (
          <div className="mt-4">
            {pages.ok ? (
              <div>
                <p className="text-sm text-navy-700">
                  Found <span className="font-semibold">{pages.pages_total}</span> page(s),{" "}
                  <span className="font-semibold">{pages.pages_ads_eligible}</span> eligible for ads.
                </p>
                <div className="mt-3 space-y-2">
                  {pages.pages.map((p) => (
                    <div key={p.id} className="rounded-lg bg-navy-50 p-3 ring-1 ring-navy-100">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.canAdvertise ? "bg-emerald-100 text-emerald-700" : "bg-navy-100 text-navy-500"}`}>
                          {p.canAdvertise ? "can advertise" : "no ads"}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-navy-700">
                        META_FB_PAGE_ID = {p.id}
                      </p>
                      {p.category && <p className="mt-0.5 text-[10px] text-navy-500">{p.category}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-coral-50 p-3 ring-1 ring-coral-200">
                <p className="text-sm font-semibold text-coral-700">Detection failed</p>
                <p className="mt-1 text-xs text-navy-700">{pages.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulation */}
      <div className="rounded-2xl bg-white p-6 ring-2 ring-purple-200">
        <h2 className="text-lg text-navy-900">End-to-end simulation</h2>
        <p className="mt-1 text-sm text-navy-600">
          Exercises every component of the autonomous loop and returns a structured trace. Use before launching real ads.
        </p>

        <div className="mt-4 grid gap-2">
          {SCENARIOS.map((s) => (
            <label key={s.id} className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition ${scenario === s.id ? "bg-purple-50 ring-purple-300" : "bg-navy-50 ring-navy-100 hover:ring-navy-300"}`}>
              <input
                type="radio"
                name="scenario"
                value={s.id}
                checked={scenario === s.id}
                onChange={() => setScenario(s.id)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-navy-900">{s.label}</p>
                <p className="mt-0.5 text-xs text-navy-600">{s.description}</p>
              </div>
            </label>
          ))}
        </div>

        <button onClick={runSimulation} disabled={busy} className="btn-primary mt-5 disabled:opacity-50">
          {busy ? "Running simulation… (3–15s)" : "Run simulation"}
        </button>

        {result && (
          <div className="mt-5">
            <div className={`rounded-xl p-4 ring-1 ${result.ok ? "bg-emerald-50 ring-emerald-200" : "bg-coral-50 ring-coral-200"}`}>
              <div className="flex items-baseline justify-between">
                <p className={`text-sm font-bold ${result.ok ? "text-emerald-700" : "text-coral-700"}`}>
                  {result.ok ? "✓" : "✗"} {result.summary}
                </p>
                <span className="text-xs text-navy-500">total: {result.totalMs}ms</span>
              </div>
              {result.decisionSummary && (
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="rounded bg-coral-100 px-2 py-0.5 text-coral-700">PAUSE: {result.decisionSummary.pause}</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">SCALE: {result.decisionSummary.scale}</span>
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-700">REMIX: {result.decisionSummary.remix}</span>
                  <span className="rounded bg-navy-100 px-2 py-0.5 text-navy-700">NO-OP: {result.decisionSummary.no_op}</span>
                </div>
              )}
              {result.tickId && (
                <p className="mt-2 font-mono text-[10px] text-navy-500">tick: {result.tickId}</p>
              )}
            </div>

            <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-navy-100">
              <table className="w-full text-xs">
                <thead className="bg-navy-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Check</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Duration</th>
                    <th className="px-3 py-2 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {result.checks.map((c, i) => (
                    <tr key={i} className="border-t border-navy-100 align-top">
                      <td className="px-3 py-2 font-mono">{c.step}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-coral-100 text-coral-700"}`}>
                          {c.ok ? "OK" : "FAIL"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{c.ms}ms</td>
                      <td className="px-3 py-2 text-navy-700">
                        {c.error ? (
                          <span className="text-coral-700">{c.error}</span>
                        ) : c.detail ? (
                          <pre className="whitespace-pre-wrap text-[10px]">{JSON.stringify(c.detail, null, 0)}</pre>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
