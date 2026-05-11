/**
 * Audit + settings helpers backed by Supabase service-role client.
 *
 * Only run from server-side code (API routes, server components). The service
 * role key bypasses RLS — never expose it to the browser.
 */

import { createClient } from "@supabase/supabase-js";
import type { Decision, OptimizerSettings, ActionType } from "./decisions";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env not set");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function readSettings(): Promise<OptimizerSettings> {
  const sb = adminClient();
  const { data, error } = await sb.from("optimizer_settings").select("id, value");
  if (error) throw error;
  const map = new Map<string, string>(data!.map((r) => [r.id as string, r.value as string]));
  return {
    mode: (map.get("mode") ?? "shadow") as OptimizerSettings["mode"],
    maxPausesPerTick: Number(map.get("max_pauses_per_tick") ?? "1"),
    maxScalesPerTick: Number(map.get("max_scales_per_tick") ?? "1"),
    minVisitsPerArm: Number(map.get("min_visits_per_arm") ?? "100"),
    minConversionsPerArm: Number(map.get("min_conversions_per_arm") ?? "5"),
    pWorstThreshold: Number(map.get("p_worst_threshold") ?? "0.95"),
    pBestThreshold: Number(map.get("p_best_threshold") ?? "0.80"),
    scalePctPerDay: Number(map.get("scale_pct_per_day") ?? "0.30"),
    maxBudgetMultiplier: Number(map.get("max_budget_multiplier") ?? "3.0"),
    startingDailyBudget: Number(map.get("starting_daily_budget") ?? "30"),
  };
}

export async function writeSetting(id: string, value: string, byUserId?: string): Promise<void> {
  const sb = adminClient();
  const { error } = await sb
    .from("optimizer_settings")
    .upsert(
      { id, value, updated_at: new Date().toISOString(), updated_by: byUserId ?? null },
      { onConflict: "id" }
    );
  if (error) throw error;
}

export async function startTick(mode: string): Promise<string> {
  const sb = adminClient();
  const { data, error } = await sb
    .from("optimizer_ticks")
    .insert({ mode, data_pull_ok: true })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id as string;
}

export async function finishTick(
  id: string,
  fields: {
    durationMs?: number;
    variantsSeen?: number;
    adsSeen?: number;
    signupsSeen?: number;
    dataPullOk?: boolean;
    errorMessage?: string;
  }
): Promise<void> {
  const sb = adminClient();
  const { error } = await sb
    .from("optimizer_ticks")
    .update({
      duration_ms: fields.durationMs ?? null,
      variants_seen: fields.variantsSeen ?? null,
      ads_seen: fields.adsSeen ?? null,
      signups_seen: fields.signupsSeen ?? null,
      data_pull_ok: fields.dataPullOk ?? true,
      error_message: fields.errorMessage ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function logAction(
  tickId: string,
  mode: string,
  d: Decision,
  enactment: { enacted: boolean; metaResponse?: unknown; proposedCopy?: unknown }
): Promise<void> {
  const sb = adminClient();
  const { error } = await sb.from("optimizer_actions").insert({
    tick_id: tickId,
    mode,
    variant: d.variant,
    creative: d.creative,
    meta_ad_id: d.metaAdId,
    action_type: d.actionType,
    rationale: d.rationale,
    visits: d.stats.visits,
    conversions: d.stats.conversions,
    spend_usd: d.stats.spendUsd,
    cpa_usd: d.stats.cpaUsd,
    p_best: d.stats.pBest,
    p_worst: d.stats.pWorst,
    enacted: enactment.enacted,
    enacted_at: enactment.enacted ? new Date().toISOString() : null,
    meta_response: enactment.metaResponse ?? null,
    proposed_copy: enactment.proposedCopy ?? null,
  });
  if (error) throw error;
}

export async function logTickError(tickId: string, message: string): Promise<void> {
  const sb = adminClient();
  await sb.from("optimizer_actions").insert({
    tick_id: tickId,
    mode: "shadow",
    variant: "system",
    action_type: "tick_error" satisfies ActionType,
    rationale: message.slice(0, 1000),
    enacted: false,
  });
}

export async function listRecentActions(limit = 50): Promise<unknown[]> {
  const sb = adminClient();
  const { data, error } = await sb
    .from("optimizer_actions")
    .select("*, optimizer_ticks(occurred_at, duration_ms)")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listRecentTicks(limit = 20): Promise<unknown[]> {
  const sb = adminClient();
  const { data, error } = await sb
    .from("optimizer_ticks")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
