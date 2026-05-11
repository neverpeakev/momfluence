"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeSetting } from "@/lib/optimizer/audit";

async function requireAdmin(): Promise<string> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("unauthorized");
  const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) throw new Error("admin only");
  return user.id;
}

export async function setMode(mode: "shadow" | "live" | "paused"): Promise<void> {
  const userId = await requireAdmin();
  await writeSetting("mode", mode, userId);
  revalidatePath("/admin/optimizer");
}

export async function setThreshold(key: string, value: string): Promise<void> {
  const userId = await requireAdmin();
  const allowed = new Set([
    "max_pauses_per_tick",
    "max_scales_per_tick",
    "min_visits_per_arm",
    "min_conversions_per_arm",
    "p_worst_threshold",
    "p_best_threshold",
    "scale_pct_per_day",
    "max_budget_multiplier",
    "starting_daily_budget",
  ]);
  if (!allowed.has(key)) throw new Error(`unknown setting ${key}`);
  await writeSetting(key, value, userId);
  revalidatePath("/admin/optimizer");
}
