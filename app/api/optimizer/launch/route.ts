/**
 * One-shot campaign launch endpoint.
 *
 * Auth: admin only (checks momfluencers.is_admin). The CRON_SECRET path is
 * not honored here — campaign creation is too consequential for cron auth.
 *
 * Body: { dailyBudgetUsd: number, costCapUsd?: number, force?: boolean }
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCampaign, preflightConfig } from "@/lib/optimizer/campaign-builder";
import { writeSetting } from "@/lib/optimizer/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: "admin only" }, { status: 403 });

  const cfg = preflightConfig();
  if (!cfg.ok) {
    return NextResponse.json({
      error: "Preflight failed — missing env vars",
      checks: cfg.checks,
    }, { status: 412 });
  }

  let body: { dailyBudgetUsd?: number; costCapUsd?: number; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }

  const dailyBudgetUsd = Number(body.dailyBudgetUsd);
  if (!Number.isFinite(dailyBudgetUsd) || dailyBudgetUsd < 5 || dailyBudgetUsd > 5000) {
    return NextResponse.json({ error: "dailyBudgetUsd must be between 5 and 5000" }, { status: 400 });
  }

  try {
    const result = await buildCampaign({
      dailyBudgetUsd,
      costCapUsd: body.costCapUsd,
      force: Boolean(body.force),
    });

    // Persist starting budget into optimizer_settings so the scale-cap math
    // is anchored correctly.
    await writeSetting("starting_daily_budget", String(dailyBudgetUsd), user.id);

    return NextResponse.json({
      ok: true,
      campaignId: result.campaignId,
      adSetId: result.adSetId,
      adsCreated: result.ads.length,
      ads: result.ads,
      warnings: result.warnings,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
