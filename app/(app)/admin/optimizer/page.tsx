import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readSettings, listRecentActions, listRecentTicks } from "@/lib/optimizer/audit";
import { setMode, setThreshold } from "./actions";
import LaunchCampaignButton from "./LaunchCampaignButton";
import PromoteRemixButton from "./PromoteRemixButton";
import { preflightConfig } from "@/lib/optimizer/campaign-builder";

export const dynamic = "force-dynamic";

interface ActionRow {
  id: string;
  occurred_at: string;
  mode: string;
  variant: string;
  creative: string | null;
  meta_ad_id: string | null;
  action_type: string;
  rationale: string;
  visits: number | null;
  conversions: number | null;
  spend_usd: number | null;
  cpa_usd: number | null;
  p_best: number | null;
  p_worst: number | null;
  enacted: boolean;
  proposed_copy: unknown;
}

interface TickRow {
  id: string;
  occurred_at: string;
  mode: string;
  duration_ms: number | null;
  variants_seen: number | null;
  ads_seen: number | null;
  signups_seen: number | null;
  data_pull_ok: boolean;
  error_message: string | null;
}

export default async function OptimizerPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) {
    return (
      <div className="card">
        <h1 className="text-2xl">Admin only</h1>
      </div>
    );
  }

  const settings = await readSettings();
  const actions = (await listRecentActions(80)) as ActionRow[];
  const ticks = (await listRecentTicks(15)) as TickRow[];
  const cfg = preflightConfig();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
            Funnel Lab · Optimizer v2
          </p>
          <h1 className="text-3xl text-navy-900">Autonomous decision system</h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-600">
            Pulls signups + ad spend every 6h, computes Bayesian posteriors per
            variant × creative, pauses underperformers + scales winners (if mode
            is <span className="font-mono">live</span>), and proposes remix candidates
            when a clear leader emerges.
          </p>
        </div>
        <ModeBadge mode={settings.mode} />
      </div>

      {/* Mode toggle */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-navy-100">
        <h2 className="text-lg text-navy-900">Mode</h2>
        <p className="mt-1 text-sm text-navy-600">
          <span className="font-semibold">Shadow:</span> log every decision, don&apos;t enact (recommended for week 1).{" "}
          <span className="font-semibold">Live:</span> actually pause/scale via Meta API.{" "}
          <span className="font-semibold">Paused:</span> kill switch — cron tick logs a no-op and exits.
        </p>
        <div className="mt-4 flex gap-3">
          {(["shadow", "live", "paused"] as const).map((m) => (
            <form key={m} action={setMode.bind(null, m)}>
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition ${
                  settings.mode === m
                    ? "bg-navy-900 text-white ring-navy-900"
                    : "bg-white text-navy-700 ring-navy-200 hover:ring-navy-400"
                }`}
              >
                {settings.mode === m ? "● " : ""}
                {m}
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Preflight checklist */}
      <div className={`rounded-2xl p-6 ring-2 ${cfg.ok ? "bg-emerald-50 ring-emerald-200" : "bg-amber-50 ring-amber-200"}`}>
        <h2 className="text-lg text-navy-900">
          {cfg.ok ? "✓ Preflight green — all env vars set" : "Preflight: env vars missing"}
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-navy-700">
          {cfg.checks.map((c) => (
            <li key={c.name} className="font-mono">
              {c.ok ? "✓" : "✗"} {c.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Launch campaign */}
      <LaunchCampaignButton />

      {/* Thresholds */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-navy-100">
        <h2 className="text-lg text-navy-900">Decision thresholds</h2>
        <p className="mt-1 text-sm text-navy-600">
          Don&apos;t touch these in week 1 unless you have a reason. Defaults are
          conservative on purpose — the optimizer only acts when it&apos;s confident.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <ThresholdInput
            label="Min visits per arm"
            keyName="min_visits_per_arm"
            value={String(settings.minVisitsPerArm)}
          />
          <ThresholdInput
            label="Min conversions per arm"
            keyName="min_conversions_per_arm"
            value={String(settings.minConversionsPerArm)}
          />
          <ThresholdInput
            label="P(worst) → PAUSE threshold"
            keyName="p_worst_threshold"
            value={String(settings.pWorstThreshold)}
            hint="0.95 = act when 95% confident this is the worst arm"
          />
          <ThresholdInput
            label="P(best) → SCALE threshold"
            keyName="p_best_threshold"
            value={String(settings.pBestThreshold)}
            hint="0.80 = act when 80% confident this is the best arm"
          />
          <ThresholdInput
            label="Max pauses per tick"
            keyName="max_pauses_per_tick"
            value={String(settings.maxPausesPerTick)}
          />
          <ThresholdInput
            label="Max scales per tick"
            keyName="max_scales_per_tick"
            value={String(settings.maxScalesPerTick)}
          />
          <ThresholdInput
            label="Scale % per day"
            keyName="scale_pct_per_day"
            value={String(settings.scalePctPerDay)}
            hint="0.30 = bump winning ad set's budget by 30% per scale event"
          />
          <ThresholdInput
            label="Max budget multiplier"
            keyName="max_budget_multiplier"
            value={String(settings.maxBudgetMultiplier)}
            hint="3.0 = cap at 3× starting daily budget"
          />
        </div>
      </div>

      {/* Recent ticks */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-navy-100">
        <h2 className="text-lg text-navy-900">Recent ticks</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-right">Dur (ms)</th>
                <th className="px-3 py-2 text-right">Variants</th>
                <th className="px-3 py-2 text-right">Ads</th>
                <th className="px-3 py-2 text-right">Signups</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {ticks.map((t) => (
                <tr key={t.id} className="border-t border-navy-100">
                  <td className="px-3 py-1.5 font-mono">{new Date(t.occurred_at).toLocaleString()}</td>
                  <td className="px-3 py-1.5">{t.mode}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{t.duration_ms ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{t.variants_seen ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{t.ads_seen ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{t.signups_seen ?? "—"}</td>
                  <td className={`px-3 py-1.5 ${t.data_pull_ok ? "text-emerald-700" : "text-coral-700"}`}>
                    {t.data_pull_ok ? "ok" : (t.error_message ?? "error")}
                  </td>
                </tr>
              ))}
              {ticks.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-navy-500">No ticks yet — first one runs at the next scheduled cron.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions log */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-navy-100">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg text-navy-900">Decision log</h2>
          <p className="text-xs text-navy-500">most recent 80</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Variant / creative</th>
                <th className="px-3 py-2 text-right">V / C</th>
                <th className="px-3 py-2 text-right">Spend</th>
                <th className="px-3 py-2 text-right">P(best)</th>
                <th className="px-3 py-2 text-right">P(worst)</th>
                <th className="px-3 py-2 text-left">Enacted</th>
                <th className="px-3 py-2 text-left">Why</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} className="border-t border-navy-100 align-top">
                  <td className="px-3 py-1.5 font-mono whitespace-nowrap">{new Date(a.occurred_at).toLocaleString()}</td>
                  <td className="px-3 py-1.5">{a.mode}</td>
                  <td className="px-3 py-1.5">
                    <ActionChip action={a.action_type} />
                  </td>
                  <td className="px-3 py-1.5 font-mono">{a.variant}{a.creative ? ` · ${a.creative}` : ""}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{a.visits ?? "—"} / {a.conversions ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{a.spend_usd != null ? `$${Number(a.spend_usd).toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{a.p_best != null ? Number(a.p_best).toFixed(2) : "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{a.p_worst != null ? Number(a.p_worst).toFixed(2) : "—"}</td>
                  <td className="px-3 py-1.5">{a.enacted ? "✓" : a.mode === "shadow" ? "shadow" : "—"}</td>
                  <td className="px-3 py-1.5 text-navy-700 max-w-md">{a.rationale}</td>
                </tr>
              ))}
              {actions.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-navy-500">No decisions logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remix proposals */}
      <RemixProposals actions={actions} />
    </div>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const color =
    mode === "live" ? "bg-emerald-500" :
    mode === "shadow" ? "bg-amber-500" :
    "bg-navy-400";
  return (
    <div className={`rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-white ${color}`}>
      {mode}
    </div>
  );
}

function ActionChip({ action }: { action: string }) {
  const colors: Record<string, string> = {
    pause: "bg-coral-100 text-coral-700 ring-coral-200",
    scale: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    remix_proposed: "bg-purple-100 text-purple-700 ring-purple-200",
    no_op: "bg-navy-50 text-navy-500 ring-navy-100",
    tick_error: "bg-red-100 text-red-700 ring-red-200",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${colors[action] ?? "bg-navy-50 text-navy-700"}`}>
      {action}
    </span>
  );
}

function ThresholdInput({ label, keyName, value, hint }: {
  label: string;
  keyName: string;
  value: string;
  hint?: string;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const next = String(formData.get("value") ?? "");
        await setThreshold(keyName, next);
      }}
      className="rounded-xl bg-navy-50 p-3 ring-1 ring-navy-100"
    >
      <label className="block">
        <span className="text-xs font-semibold text-navy-700">{label}</span>
        <div className="mt-1 flex gap-2">
          <input name="value" defaultValue={value} className="input flex-1 text-sm" />
          <button type="submit" className="rounded bg-navy-900 px-3 py-1 text-xs font-semibold text-white">save</button>
        </div>
        {hint && <p className="mt-1 text-[10px] text-navy-500">{hint}</p>}
      </label>
    </form>
  );
}

interface RemixCandidate {
  hypothesis: string;
  angle: string;
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  closer: { headline: string; subhead: string };
  notes: string;
}

function RemixProposals({ actions }: { actions: ActionRow[] }) {
  const remixes = actions.filter(
    (a) => a.action_type === "remix_proposed" && a.proposed_copy && !(typeof a.proposed_copy === "object" && a.proposed_copy !== null && "error" in (a.proposed_copy as Record<string, unknown>))
  );
  if (remixes.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-6 ring-2 ring-purple-200">
      <h2 className="text-lg text-navy-900">LLM-proposed remix candidates</h2>
      <p className="mt-1 text-sm text-navy-600">
        Claude Opus 4.7-generated variants based on winning hooks. Click <span className="font-semibold">Promote</span> on
        any candidate to insert it into the live test as a paused Meta ad. The renderer auto-generates
        its creative PNG via Playwright — no manual screenshot needed.
      </p>
      <div className="mt-4 space-y-4">
        {remixes.map((r) => {
          const candidates = Array.isArray(r.proposed_copy)
            ? (r.proposed_copy as RemixCandidate[])
            : [];
          return (
            <div key={r.id} className="rounded-xl bg-purple-50 p-4 ring-1 ring-purple-200">
              <p className="text-sm font-semibold text-navy-900">
                From winner: <span className="font-mono">{r.variant}</span>
                <span className="ml-3 text-xs font-normal text-navy-500">
                  {new Date(r.occurred_at).toLocaleString()}
                </span>
              </p>
              <div className="mt-3 space-y-2">
                {candidates.map((c, i) => (
                  <div key={i} className="rounded-lg bg-white p-4 ring-1 ring-navy-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-coral-600">
                          candidate {i + 1} · {c.angle}
                        </p>
                        <p className="mt-1 text-xs italic text-navy-500">{c.hypothesis}</p>
                        <p className="mt-2 font-display text-base font-bold whitespace-pre-line text-navy-900">
                          {c.hero.headline}
                        </p>
                        <p className="mt-1 text-xs text-navy-700">{c.hero.subhead}</p>
                        <p className="mt-2 text-[10px] text-navy-500">
                          CTA: <span className="font-semibold">{c.hero.ctaPrimary}</span>
                          {" · "}closer: <span className="font-semibold">{c.closer.headline}</span>
                        </p>
                        {c.notes && (
                          <p className="mt-2 text-[10px] italic text-purple-700">{c.notes}</p>
                        )}
                      </div>
                    </div>
                    <PromoteRemixButton
                      actionId={r.id}
                      candidateIndex={i}
                      candidateAngle={c.angle}
                      candidateHeadline={c.hero.headline}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
