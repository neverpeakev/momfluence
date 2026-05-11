/**
 * Promote a Claude-generated remix candidate into a live test variant.
 *
 * Flow:
 *   1. Admin (or autonomous tick, if auto-promotion is enabled — currently
 *      human-gated by default) sends { actionId, candidateIndex }.
 *   2. We pull the remix proposal from optimizer_actions.
 *   3. Insert the chosen candidate into funnel_variants (DB-backed).
 *   4. Create a matching Meta ad in the existing campaign:
 *        - Ad creative with image_url = /api/render/creative/<new-slug>.png
 *          (Playwright renders on first fetch, Meta caches)
 *        - Ad pointing at /lp/<new-slug>?c=<new-creative-id>
 *   5. Mark the optimizer_action as enacted with the new ad_id.
 *
 * Auth: admin only by default. To enable fully autonomous promotion later, add
 * a service-role variant that accepts CRON_SECRET — but keep human-in-the-loop
 * for v2 (this is the spend-risk surface).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { insertRuntimeVariant } from "@/lib/funnel-lab/runtime-variants";
import type { RemixCandidate } from "@/lib/optimizer/anthropic-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const API_VERSION = "v20.0";
const FB_BASE = `https://graph.facebook.com/${API_VERSION}`;

function metaToken() {
  const t = process.env.META_MARKETING_API_TOKEN;
  if (!t) throw new Error("META_MARKETING_API_TOKEN not set");
  return t.trim();
}

function metaAdAccount() {
  const a = process.env.META_AD_ACCOUNT_ID;
  if (!a) throw new Error("META_AD_ACCOUNT_ID not set");
  return a.startsWith("act_") ? a : `act_${a}`;
}

function metaFbPage() {
  const id = process.env.META_FB_PAGE_ID;
  if (!id) throw new Error("META_FB_PAGE_ID not set");
  return id;
}

function adminSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env not set");
  return createAdminClient(url, key, { auth: { persistSession: false } });
}

async function metaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${FB_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${metaToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Meta ${path} → ${res.status}: ${txt.slice(0, 500)}`);
  return JSON.parse(txt) as T;
}

function siteOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "momfluence.app";
  return `${proto}://${host}`;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  // Admin auth
  const sb = await createUserClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: "admin only" }, { status: 403 });

  let body: { actionId?: string; candidateIndex?: number; adSetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }
  if (!body.actionId || typeof body.candidateIndex !== "number") {
    return NextResponse.json({ error: "actionId and candidateIndex required" }, { status: 400 });
  }

  const admin = adminSb();

  // 1. Fetch the remix action
  const { data: action, error: actionErr } = await admin
    .from("optimizer_actions")
    .select("id, variant, proposed_copy, meta_ad_id")
    .eq("id", body.actionId)
    .single();
  if (actionErr || !action) {
    return NextResponse.json({ error: "action not found" }, { status: 404 });
  }

  const candidates = action.proposed_copy as RemixCandidate[] | null;
  if (!Array.isArray(candidates) || !candidates[body.candidateIndex]) {
    return NextResponse.json({ error: "candidate not found in proposal" }, { status: 404 });
  }
  const candidate = candidates[body.candidateIndex];

  // 2. Generate new slug + creative id. Suffix with action id + index for uniqueness.
  const baseSlug = slugify(candidate.angle || candidate.hero.headline.split("\n")[0]);
  const slugSuffix = action.id.slice(0, 6);
  const newSlug = `${baseSlug}-${slugSuffix}-${body.candidateIndex}`;
  // Creative id: monotonic-ish suffix. c100+ leaves room for the seed range.
  const newCreativeId = `c${100 + Math.floor(Date.now() / 1000) % 9000}-${body.candidateIndex}`;

  // 3. Insert runtime variant
  try {
    await insertRuntimeVariant({
      slug: newSlug,
      label: `Remix · ${candidate.angle}`,
      hypothesis: candidate.hypothesis,
      angle: candidate.angle,
      primaryCreativeId: newCreativeId,
      hero: candidate.hero,
      closer: candidate.closer,
      source: "remix",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `failed to insert variant: ${msg}` }, { status: 500 });
  }

  // 4. Create Meta ad creative + ad
  const adSetId = body.adSetId ?? process.env.META_AD_SET_ID;
  if (!adSetId) {
    return NextResponse.json({
      error: "META_AD_SET_ID not set — promotion succeeded as variant but no ad was created",
      newSlug,
    }, { status: 200 });
  }

  const origin = siteOrigin(req);
  const imageUrl = `${origin}/api/render/creative/${encodeURIComponent(newSlug)}.png`;
  const destination = `${origin}/lp/${newSlug}?c=${newCreativeId}&utm_source=meta&utm_campaign=funnel-lab-remix&utm_content=${newCreativeId}`;

  let adId: string | null = null;
  let adCreativeId: string | null = null;
  let warning: string | null = null;

  try {
    const adCreative = await metaFetch<{ id: string }>(`/${metaAdAccount()}/adcreatives`, {
      method: "POST",
      body: JSON.stringify({
        name: `${newCreativeId} — ${newSlug} — remix`,
        object_story_spec: {
          page_id: metaFbPage(),
          link_data: {
            image_url: imageUrl,
            link: destination,
            message: candidate.hero.subhead,
            name: candidate.hero.headline.replace(/\n/g, " "),
            description: candidate.hero.eyebrow,
            call_to_action: { type: "SIGN_UP", value: { link: destination } },
          },
        },
      }),
    });
    adCreativeId = adCreative.id;

    const ad = await metaFetch<{ id: string }>(`/${metaAdAccount()}/ads`, {
      method: "POST",
      body: JSON.stringify({
        name: `${newCreativeId} — ${newSlug}`,
        adset_id: adSetId,
        creative: { creative_id: adCreative.id },
        status: "PAUSED",
      }),
    });
    adId = ad.id;
  } catch (e) {
    warning = e instanceof Error ? e.message : String(e);
  }

  // 5. Mark action as enacted
  await admin
    .from("optimizer_actions")
    .update({
      enacted: adId !== null,
      enacted_at: adId !== null ? new Date().toISOString() : null,
      meta_response: { adCreativeId, adId, warning, promoted_slug: newSlug, promoted_creative_id: newCreativeId },
    })
    .eq("id", action.id);

  return NextResponse.json({
    ok: true,
    promotedVariantSlug: newSlug,
    creativeId: newCreativeId,
    metaAdId: adId,
    metaAdCreativeId: adCreativeId,
    imageUrl,
    landingPageUrl: destination,
    warning,
  });
}
