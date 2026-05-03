// sync_flexoffers_sales (v5): pulls FlexOffers v3 /allsales for a sliding window.
// Endpoint, params, and field mapping per the official Swagger:
// https://api.flexoffers.com/content/swagger/flexoffers_v3.json
// Auth: header `apiKey: <value>`. Status filter is per-call (we loop approved/pending/cancelled).
// Body: { windowDays: 7 }. Defensive: API key never in URL paths; redacted from logs.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const FLEXOFFERS_NETWORK_ID = "2707bfaf-385e-438b-b184-93880cf71ab9";
const FLEX_API_BASE = "https://api.flexoffers.com/v3";
const STATUSES = ["approved", "pending", "cancelled"]; // British spelling per spec
const PAGE_SIZE = 500;
const PAGE_HARD_CAP = 50;

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

function makeRedactor(...secrets: string[]): (s: string) => string {
  const filtered = secrets.filter((s) => s && s.length >= 8);
  return (s: string) => {
    let out = s;
    for (const sec of filtered) out = out.split(sec).join("<redacted>");
    out = out.replace(/([?&]apikey=)[^&\s"']+/gi, "$1<redacted>");
    out = out.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<redacted-uuid>");
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
    .select("id").single();
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
  await supabase.from("network_sync_runs")
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
  const { data } = await supabase.from("tracking_links").select("id, offer_id").eq("token", token).maybeSingle();
  return data as { id: string; offer_id: string } | null;
}

async function getOfferMarginBps(offerId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data } = await supabase.from("offers").select("margin_bps").eq("id", offerId).single();
  return ((data as { margin_bps: number } | null)?.margin_bps) ?? 1000;
}

function calculatePayoutSplit(networkPayoutCents: number, marginBps: number) {
  const momPayoutCents = Math.floor((networkPayoutCents * (10000 - marginBps)) / 10000);
  return { momPayoutCents, marginCents: networkPayoutCents - momPayoutCents };
}

function mapFlexState(flexStatus: string): string {
  const s = flexStatus.toLowerCase();
  if (s === "approved") return "approved";
  if (s === "pending") return "pending";
  if (s === "cancelled" || s === "canceled") return "reversed";
  if (s === "bonus") return "approved";
  if (s === "non-commissionable") return "reversed";
  return "pending";
}

interface FlexSale {
  FLX_SalesId?: number;
  TransactionKey?: string;
  subTracking?: string;
  SubTracking?: string;
  commission?: number;
  saleAmount?: number;
  postedDate?: string;
  clickDate?: string;
  eventDate?: string;
  lockingDate?: string;
  ModifiedDate?: string;
  ProgramId?: number;
  ProgramName?: string;
  orderStatus?: string;
  AdjustmentType?: string;
  isPaid?: boolean;
  [key: string]: unknown;
}

async function fetchPage(apiKey: string, status: string, startStr: string, endStr: string, page: number): Promise<FlexSale[]> {
  const url = `${FLEX_API_BASE}/allsales?status=${status}&reportType=sales&dateType=postedDate&startDate=${startStr}&endDate=${endStr}&page=${page}&pageSize=${PAGE_SIZE}&sortOrder=ASC`;
  const resp = await fetch(url, {
    headers: { Accept: "application/json", apiKey: apiKey },
  });
  if (resp.status === 204) return [];
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`FlexOffers ${resp.status} on status=${status} page=${page}: ${text.slice(0, 300)}`);
  }
  const text = await resp.text();
  if (!text.trim()) return [];
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { throw new Error(`FlexOffers non-JSON response on status=${status}`); }
  if (Array.isArray(payload)) return payload as FlexSale[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const k of ["sales", "Sales", "data", "Data", "results", "Results", "transactions", "Transactions", "items", "Items", "allsales", "AllSales"]) {
      if (Array.isArray(obj[k])) return obj[k] as FlexSale[];
    }
  }
  return [];
}

Deno.serve(async (req: Request) => {
  let redact = (s: string) => s;
  try {
    let triggerSecret: string;
    let apiKey: string | null = null;
    try {
      const secrets = await getVaultSecrets(["sync_trigger_secret", "flexoffers_api_key"]);
      triggerSecret = secrets["sync_trigger_secret"];
      apiKey = secrets["flexoffers_api_key"] ?? null;
      if (!triggerSecret) return jsonResponse({ error: "trigger secret not configured" }, 500);
      redact = makeRedactor(triggerSecret, apiKey ?? "");
    } catch (e) {
      return jsonResponse({ error: `vault read failed: ${(e as Error).message}` }, 500);
    }

    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!bearer || !timingSafeEqual(bearer, triggerSecret)) return jsonResponse({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const windowDays = Number((body as { windowDays?: number }).windowDays) || 7;

    const now = new Date();
    const start = new Date(now.getTime() - windowDays * 86400 * 1000);

    let runId: string;
    try {
      runId = await startSyncRun(FLEXOFFERS_NETWORK_ID, "sales", start, now);
    } catch (e) {
      const msg = redact(`startSyncRun failed: ${(e as Error).message}`);
      console.error(msg);
      return jsonResponse({ ok: false, error: msg }, 500);
    }

    try {
      if (!apiKey) throw new Error("FlexOffers API key missing from Vault (flexoffers_api_key)");

      // FlexOffers /allsales accepts ISO datetime strings; date-only also works.
      const startStr = start.toISOString();
      const endStr = now.toISOString();

      let totalFetched = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let firstSample: FlexSale | null = null;
      const perStatusCounts: Record<string, number> = {};

      const supabase = getServiceClient();

      for (const flexStatus of STATUSES) {
        let page = 1;
        let perStatus = 0;
        while (page <= PAGE_HARD_CAP) {
          const rows = await fetchPage(apiKey, flexStatus, startStr, endStr, page);
          if (!rows.length) break;
          if (firstSample === null) firstSample = rows[0];
          totalFetched += rows.length;
          perStatus += rows.length;

          for (const row of rows) {
            const subId = (row.subTracking || row.SubTracking || "").toString().trim();
            if (!subId) { totalSkipped++; continue; }

            const networkEventId = (row.TransactionKey || row.FLX_SalesId?.toString() || "").trim();
            if (!networkEventId) { totalSkipped++; continue; }

            const link = await lookupTrackingLinkByToken(subId);
            if (!link) { totalSkipped++; continue; }

            const networkPayoutCents = Math.round((row.commission ?? 0) * 100);
            const marginBps = await getOfferMarginBps(link.offer_id);
            const { momPayoutCents, marginCents } = calculatePayoutSplit(networkPayoutCents, marginBps);
            const conversionStatus = mapFlexState(flexStatus);
            const approvedAt = conversionStatus === "approved" ? (row.lockingDate || row.postedDate || null) : null;

            const { data: existing } = await supabase.from("conversions").select("id").eq("network_event_id", networkEventId).maybeSingle();
            const conversionRow = {
              tracking_link_id: link.id,
              network_event_id: networkEventId,
              network_payout_cents: networkPayoutCents,
              momfluencer_payout_cents: momPayoutCents,
              status: conversionStatus,
              approved_at: approvedAt,
              raw_payload: row,
            };

            if (existing) {
              await supabase.from("conversions").update(conversionRow).eq("id", (existing as { id: string }).id);
              totalUpdated++;
            } else {
              await supabase.from("conversions").insert(conversionRow);
              totalInserted++;
            }
          }

          if (rows.length < PAGE_SIZE) break;
          page++;
        }
        perStatusCounts[flexStatus] = perStatus;
      }

      await completeSyncRun(runId, "success", {
        rows_fetched: totalFetched,
        rows_inserted: totalInserted,
        rows_updated: totalUpdated,
        rows_skipped: totalSkipped,
        raw_response_sample: { per_status_counts: perStatusCounts, first_sample: firstSample },
      });
      await markCredentialSyncResult(FLEXOFFERS_NETWORK_ID, null);

      return jsonResponse({
        ok: true,
        windowDays,
        endpoint: "/v3/allsales",
        per_status_counts: perStatusCounts,
        fetched: totalFetched,
        inserted: totalInserted,
        updated: totalUpdated,
        skipped: totalSkipped,
      });
    } catch (e) {
      const message = redact(e instanceof Error ? e.message : String(e));
      console.error("sync_flexoffers_sales error:", message);
      try {
        await completeSyncRun(runId, "failed", { error_message: message });
        await markCredentialSyncResult(FLEXOFFERS_NETWORK_ID, message);
      } catch (_) {}
      return jsonResponse({ ok: false, error: message }, 500);
    }
  } catch (outer) {
    const m = redact(outer instanceof Error ? outer.message : String(outer));
    console.error("sync_flexoffers_sales outer crash:", m);
    return jsonResponse({ ok: false, error: `outer: ${m}` }, 500);
  }
});
