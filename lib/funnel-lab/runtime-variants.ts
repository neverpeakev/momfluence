/**
 * Runtime-promoted variants — stored in Supabase rather than code.
 *
 * The seed 10 variants live in `variants.ts` (immutable, version-controlled).
 * When the optimizer promotes a Claude-generated remix into a live test, it
 * lands in `funnel_variants` (DB) and is served alongside the seeds.
 *
 * Lookup paths:
 *   findVariant(slug)        → code-defined (sync, instant)
 *   findRuntimeVariant(slug) → DB-defined  (async, server-only)
 *   findAnyVariant(slug)     → tries both
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { FunnelVariant } from "./variants";

function adminSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

interface DbVariantRow {
  slug: string;
  label: string;
  hypothesis: string;
  angle: string;
  funnel: string;
  below_fold: string;
  primary_creative_id: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subhead: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  closer_headline: string;
  closer_subhead: string;
  source: "seed" | "remix";
  promoted_at: string | null;
  status: "active" | "archived";
}

function rowToVariant(r: DbVariantRow): FunnelVariant {
  return {
    slug: r.slug,
    label: r.label,
    hypothesis: r.hypothesis,
    angle: r.angle,
    funnel: r.funnel as FunnelVariant["funnel"],
    belowFold: r.below_fold as FunnelVariant["belowFold"],
    primaryCreativeId: r.primary_creative_id,
    hero: {
      eyebrow: r.hero_eyebrow,
      headline: r.hero_headline,
      subhead: r.hero_subhead,
      ctaPrimary: r.hero_cta_primary,
      ctaSecondary: r.hero_cta_secondary,
    },
    closer: {
      headline: r.closer_headline,
      subhead: r.closer_subhead,
    },
  };
}

export async function findRuntimeVariant(slug: string): Promise<FunnelVariant | undefined> {
  try {
    const sb = adminSb();
    const { data, error } = await sb
      .from("funnel_variants")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error || !data) return undefined;
    return rowToVariant(data as DbVariantRow);
  } catch {
    // Table may not exist yet on a stale env — return undefined cleanly.
    return undefined;
  }
}

export async function listRuntimeVariants(): Promise<FunnelVariant[]> {
  try {
    const sb = adminSb();
    const { data, error } = await sb
      .from("funnel_variants")
      .select("*")
      .eq("status", "active")
      .order("promoted_at", { ascending: false });
    if (error || !data) return [];
    return (data as DbVariantRow[]).map(rowToVariant);
  } catch {
    return [];
  }
}

export interface InsertRuntimeVariantInput {
  slug: string;
  label: string;
  hypothesis: string;
  angle: string;
  primaryCreativeId: string;
  hero: FunnelVariant["hero"];
  closer: FunnelVariant["closer"];
  funnel?: FunnelVariant["funnel"];
  belowFold?: FunnelVariant["belowFold"];
  source?: "seed" | "remix";
}

export async function insertRuntimeVariant(v: InsertRuntimeVariantInput): Promise<void> {
  const sb = adminSb();
  const { error } = await sb.from("funnel_variants").insert({
    slug: v.slug,
    label: v.label,
    hypothesis: v.hypothesis,
    angle: v.angle,
    funnel: v.funnel ?? "direct",
    below_fold: v.belowFold ?? "full",
    primary_creative_id: v.primaryCreativeId,
    hero_eyebrow: v.hero.eyebrow,
    hero_headline: v.hero.headline,
    hero_subhead: v.hero.subhead,
    hero_cta_primary: v.hero.ctaPrimary,
    hero_cta_secondary: v.hero.ctaSecondary,
    closer_headline: v.closer.headline,
    closer_subhead: v.closer.subhead,
    source: v.source ?? "remix",
    promoted_at: new Date().toISOString(),
    status: "active",
  });
  if (error) throw error;
}
