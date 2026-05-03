// sync_impact_actions: pulls Impact.com Actions for a sliding window,
// attributes each by SubId1 -> tracking_links.token, upserts conversions.
// Auth: shared bearer token (sync_trigger_secret in Vault).
// Body: { windowHours: 24 } - defaults to 24.
// Date format: ISO without milliseconds (Impact rejects 2026-05-03T00:00:00.123Z).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const IMPACT_NETWORK_ID = "c4ed1cb8-2767-4c38-b62c-a58c8528da0a";

let cached: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required");
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

async function getVaultSecrets(names: string[]): Promise<Record<string, string>> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("get_vault_secrets", { p_names: names });
  if (error) throw new Error(`Vault read failed: ${error.message}`);
  const out: Record<string, string> = {};
  for (const row of (data || []) as { name: string; secret: string }[]) {
    out[row.name] = row.secret;
  }
  return out;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Impact rejects ISO timestamps with milliseconds. Format: YYYY-MM-DDTHH:MM:SSZ
function toImpactDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function makeRedactor(...secrets: string[]): (s: string) => string {
  const filtered = secrets.filter((s) => s && s.length >= 8);
  return (s: string) => {
    let out = s;
    for (const sec of filtered) out = out.split(sec).join("<redacted>");
    return out;
  };
}

async function startSyncRun(networkId: string, syncType: string, windowStart: Date, windowEnd: Date): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("network_sync_runs")
    .insert({
      network_id: networkId,
      sync_type: syncType,
      status: "running",
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Could not create sync run: ${error?.message}`);
  return (data as { id: string }).id;
}

interface SyncRunFields {
  rows_fetched?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_skipped?: number;
  error_message?: string | null;
  raw_response_sample?: unknown;
}

async function completeSyncRun(runId: string, status: string, fields: SyncRunFields): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("network_sync_runs")
    .update({ status, completed_at: new Date().toISOString(), ...fields })
    .eq("id", runId);
}

async function markCredentialSyncResult(networkId: string, errorMessage: string | null): Promise<void> {
  const supabase = getServiceClient();
  const update: Record<string, unknown> = {
    last_attempted_sync_at: new Date().toISOString(),
    last_error: errorMessage,
  };
  if (errorMessage === null) update.last_successful_sync_at = new Date().toISOString();
  await supabase.from("network_credentials").update(update).eq("network_id", networkId);
}

async function lookupTrackingLinkByToken(token: string): Promise<{ id: string; offer_id: string } | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("tracking_links")
    .select("id, offer_id")
    .eq("token", token)
    .maybeSingle();
  return data as { id: string; offer_id: string } | null;
}

async function getOfferMarginBps(offerId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data } = await supabase.from("offers").select("margin_bps").eq("id", offerId).single();
  return ((data as { margin_bps: number } | null)?.margin_bps) ?? 1000;
}

function calculatePayoutSplit(networkPayoutCents: number, marginBps: number): { momPayoutCents: number; marginCents: number } {
  const momPayoutCents = Math.floor((networkPayoutCents * (10000 - marginBps)) / 10000);
  const marginCents = networkPayoutCents - momPayoutCents;
  return { momPayoutCents, marginCents };
}

function mapImpactState(state?: string): string {
  switch ((state || "").toUpperCase()) {
    case "APPROVED":
    case "LOCKED": return "approved";
    case "PENDING": return "pending";
    case "REVERSED":
    case "REJECTED": return "reversed";
    case "PAID": return "paid";
    default: return "pending";
  }
}

interface ImpactAction {
  Id?: string;
  State?: string;
  Status?: string;
  Payout?: string | number;
  IntendedPayout?: string | number;
  Amount?: string | number;
  SubId1?: string;
  EventDate?: string;
  LockingDate?: string;
  [key: string]: unknown;
}

Deno.serve(async (req: Request) => {
  let redact = (s: string) => s;
  try {
    let triggerSecret: string;
    let sid = "";
    let token = "";
    try {
      const secrets = await getVaultSecrets(["sync_trigger_secret", "impact_account_sid", "impact_auth_token"]);
      triggerSecret = secrets["sync_trigger_secret"];
      sid = secrets["impact_account_sid"] ?? "";
      token = secrets["impact_auth_token"] ?? "";
      if (!triggerSecret) return jsonResponse({ error: "trigger secret not configured" }, 500);
      redact = makeRedactor(triggerSecret, token);
    } catch (e) {
      return jsonResponse({ error: `vault read failed: ${(e as Error).message}` }, 500);
    }

    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!bearer || !timingSafeEqual(bearer, triggerSecret)) return jsonResponse({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const windowHours = Number((body as { windowHours?: number }).windowHours) || 24;

    const now = new Date();
    const start = new Date(now.getTime() - windowHours * 3600 * 1000);

    let runId: string;
    try {
      runId = await startSyncRun(IMPACT_NETWORK_ID, "actions", start, now);
    } catch (e) {
      const msg = redact(`startSyncRun failed: ${(e as Error).message}`);
      console.error(msg);
      return jsonResponse({ ok: false, error: msg }, 500);
    }

    try {
      if (!sid || !token) throw new Error("Impact credentials missing from Vault");

      const basicAuth = "Basic " + btoa(`${sid}:${token}`);
      const startStr = toImpactDate(start);
      const endStr = toImpactDate(now);

      let page = 1;
      const pageSize = 1000;
      let totalFetched = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let firstSample: unknown = null;
      const pageHardCap = 25;

      while (page <= pageHardCap) {
        const apiUrl =
          `https://api.impact.com/Mediapartners/${encodeURIComponent(sid)}/Actions` +
          `?ActionDateStart=${encodeURIComponent(startStr)}` +
          `&ActionDateEnd=${encodeURIComponent(endStr)}` +
          `&Page=${page}&PageSize=${pageSize}`;

        const resp = await fetch(apiUrl, {
          headers: { Authorization: basicAuth, Accept: "application/json" },
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Impact API ${resp.status}: ${text.slice(0, 600)}`);
        }

        const data = await resp.json();
        const actions: ImpactAction[] = (data.Actions || []) as ImpactAction[];

        if (firstSample === null && actions.length > 0) firstSample = actions[0];
        totalFetched += actions.length;

        for (const action of actions) {
          const subId = (action.SubId1 || "").toString().trim();
          if (!subId) { totalSkipped++; continue; }

          const networkEventId = action.Id?.toString();
          if (!networkEventId) { totalSkipped++; continue; }

          const link = await lookupTrackingLinkByToken(subId);
          if (!link) { totalSkipped++; continue; }

          const marginBps = await getOfferMarginBps(link.offer_id);
          const networkPayoutCents = Math.round(
            parseFloat((action.Payout ?? action.IntendedPayout ?? "0").toString()) * 100,
          );
          const { momPayoutCents, marginCents } = calculatePayoutSplit(networkPayoutCents, marginBps);
          const status = mapImpactState(action.State || action.Status);

          const supabase = getServiceClient();
          const { data: existing } = await supabase
            .from("conversions")
            .select("id")
            .eq("network_event_id", networkEventId)
            .maybeSingle();

          const row = {
            tracking_link_id: link.id,
            network_event_id: networkEventId,
            network_payout_cents: networkPayoutCents,
            momfluencer_payout_cents: momPayoutCents,
            status,
            approved_at: status === "approved" ? (action.LockingDate || null) : null,
            raw_payload: action,
          };

          if (existing) {
            await supabase.from("conversions").update(row).eq("id", (existing as { id: string }).id);
            totalUpdated++;
          } else {
            await supabase.from("conversions").insert(row);
            totalInserted++;
          }
        }

        if (actions.length < pageSize) break;
        page++;
      }

      await completeSyncRun(runId, "success", {
        rows_fetched: totalFetched,
        rows_inserted: totalInserted,
        rows_updated: totalUpdated,
        rows_skipped: totalSkipped,
        raw_response_sample: firstSample,
      });
      await markCredentialSyncResult(IMPACT_NETWORK_ID, null);

      return jsonResponse({
        ok: true,
        windowHours,
        fetched: totalFetched,
        inserted: totalInserted,
        updated: totalUpdated,
        skipped: totalSkipped,
      });
    } catch (e) {
      const message = redact(e instanceof Error ? e.message : String(e));
      console.error("sync_impact_actions error:", message);
      try {
        await completeSyncRun(runId, "failed", { error_message: message });
        await markCredentialSyncResult(IMPACT_NETWORK_ID, message);
      } catch (_) {}
      return jsonResponse({ ok: false, error: message }, 500);
    }
  } catch (outer) {
    const m = redact(outer instanceof Error ? outer.message : String(outer));
    console.error("sync_impact_actions outer crash:", m);
    return jsonResponse({ ok: false, error: `outer: ${m}` }, 500);
  }
});
