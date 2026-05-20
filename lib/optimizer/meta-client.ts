/**
 * Minimal Meta Marketing API client.
 *
 * Scope: just the endpoints the optimizer needs.
 *   - List ads in an ad set + their statuses
 *   - Get insights (impressions, clicks, spend) per ad over a date range
 *   - Pause an ad (status = PAUSED)
 *   - Update ad-set daily budget (for SCALE actions)
 *
 * Auth: Bearer token from process.env.META_MARKETING_API_TOKEN. Permissions
 * required: ads_management, ads_read. Token must be tied to the user/system-user
 * with admin role on the ad account.
 *
 * API version pinned to v20.0. Bump explicitly when you upgrade — Meta breaks
 * field names between major versions.
 */

const API_VERSION = "v20.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

function token(): string {
  const t = process.env.META_MARKETING_API_TOKEN;
  if (!t) throw new Error("META_MARKETING_API_TOKEN not set");
  return t.trim();
}

function adAccountId(): string {
  const a = process.env.META_AD_ACCOUNT_ID;
  if (!a) throw new Error("META_AD_ACCOUNT_ID not set");
  // Accept either "act_xxx" or bare "xxx" — normalize to "act_xxx".
  return a.startsWith("act_") ? a : `act_${a}`;
}

function adSetId(): string {
  const id = process.env.META_AD_SET_ID;
  if (!id) throw new Error("META_AD_SET_ID not set");
  return id;
}

async function metaFetch<T>(
  path: string,
  init: RequestInit & { qs?: Record<string, string> } = {}
): Promise<T> {
  const { qs, ...rest } = init;
  const url = new URL(`${BASE}${path}`);
  if (qs) for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meta API ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Meta API ${path} → bad JSON: ${text.slice(0, 200)}`);
  }
}

export interface MetaAd {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED" | string;
  effective_status?: string;
  creative?: { id: string; name?: string };
}

export interface MetaAdInsights {
  ad_id: string;
  ad_name?: string;
  impressions: number;
  clicks: number;
  spend: number; // USD
  cpm?: number;
  cpc?: number;
  ctr?: number;
  date_start?: string;
  date_stop?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string; // cents, string per Meta API
  lifetime_budget?: string;
}

/** List all ads in the configured ad set with their current status. */
export async function listAds(): Promise<MetaAd[]> {
  type Resp = { data: MetaAd[]; paging?: { next?: string } };
  const out: MetaAd[] = [];
  let next: string | undefined;
  let pages = 0;
  do {
    const path = next
      ? new URL(next).pathname + new URL(next).search
      : `/${adSetId()}/ads`;
    const qs = next
      ? undefined
      : { fields: "id,name,status,effective_status,creative{id,name}", limit: "100" };
    const r: Resp = await metaFetch<Resp>(path, qs ? { qs } : {});
    out.push(...r.data);
    next = r.paging?.next;
    pages += 1;
  } while (next && pages < 10);
  return out;
}

/** Get last-N-day insights per ad in the ad set. */
export async function getAdInsights(daysBack = 7): Promise<MetaAdInsights[]> {
  const datePreset =
    daysBack === 1 ? "yesterday" :
    daysBack === 7 ? "last_7d" :
    daysBack === 14 ? "last_14d" :
    daysBack === 30 ? "last_30d" : "last_7d";

  type Resp = { data: Array<Record<string, unknown>> };
  const r = await metaFetch<Resp>(`/${adSetId()}/insights`, {
    qs: {
      level: "ad",
      fields: "ad_id,ad_name,impressions,clicks,spend,cpm,cpc,ctr,date_start,date_stop",
      date_preset: datePreset,
      limit: "100",
    },
  });

  return r.data.map((row) => ({
    ad_id: String(row.ad_id ?? ""),
    ad_name: typeof row.ad_name === "string" ? row.ad_name : undefined,
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    spend: Number(row.spend ?? 0),
    cpm: row.cpm != null ? Number(row.cpm) : undefined,
    cpc: row.cpc != null ? Number(row.cpc) : undefined,
    ctr: row.ctr != null ? Number(row.ctr) : undefined,
    date_start: typeof row.date_start === "string" ? row.date_start : undefined,
    date_stop: typeof row.date_stop === "string" ? row.date_stop : undefined,
  }));
}

/** Pause a single ad. Returns the Meta API response for the audit log. */
export async function pauseAd(adId: string): Promise<unknown> {
  return metaFetch<unknown>(`/${adId}`, {
    method: "POST",
    body: JSON.stringify({ status: "PAUSED" }),
  });
}

/** Get the current ad set (used to read daily_budget for scale math). */
export async function getAdSet(): Promise<MetaAdSet> {
  return metaFetch<MetaAdSet>(`/${adSetId()}`, {
    qs: { fields: "id,name,status,daily_budget,lifetime_budget" },
  });
}

/**
 * Update the ad set's daily budget. Meta expects amounts in CENTS as a string.
 * (Why does the API not accept numbers? Don't ask.)
 */
export async function setAdSetDailyBudget(newDailyBudgetUsd: number): Promise<unknown> {
  const cents = Math.round(newDailyBudgetUsd * 100);
  return metaFetch<unknown>(`/${adSetId()}`, {
    method: "POST",
    body: JSON.stringify({ daily_budget: String(cents) }),
  });
}

/** Sanity helper for the admin UI — is the token + IDs configured? */
export function isConfigured(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.META_MARKETING_API_TOKEN) missing.push("META_MARKETING_API_TOKEN");
  if (!process.env.META_AD_ACCOUNT_ID) missing.push("META_AD_ACCOUNT_ID");
  if (!process.env.META_AD_SET_ID) missing.push("META_AD_SET_ID");
  return { ok: missing.length === 0, missing };
}

/** Account-level reachability check. Used as a pre-launch connectivity probe
 *  since this does NOT require META_AD_SET_ID (which only exists after Launch). */
export interface MetaAdAccount {
  id: string;
  account_id?: string;
  name?: string;
  currency?: string;
  account_status?: number;
}
export async function pingAccount(): Promise<MetaAdAccount> {
  return metaFetch<MetaAdAccount>(`/${adAccountId()}`, {
    qs: { fields: "id,account_id,name,currency,account_status" },
  });
}

/** Unused but exported so consumers can reference the API version pinned by this client. */
export const META_API_VERSION = API_VERSION;

/** Re-export account-id resolver for places that need to construct URLs directly. */
export { adAccountId };

// ─── Video creative upload (added 2026-05-20) ────────────────────────────────
//
// Meta video ad pipeline diverges from images in three meaningful ways:
//
//   1. Upload endpoint is /<act>/advideos, not /<act>/adimages. Returns
//      `{ id: "<video_id>", success: true }`. Multipart-friendly here
//      (unlike /adimages which needs base64 in form-urlencoded `bytes`).
//   2. Videos are async — they go into a `processing` status and must
//      finish encoding before they can be referenced in an ad creative.
//      Poll /<video_id>?fields=status until `video_status: ready`.
//   3. Ad creative spec uses object_story_spec.video_data { video_id,
//      image_url (thumbnail), call_to_action, message, title } instead
//      of link_data. See lib/optimizer/video-ad-builder.ts.
//
// History: tried the image-style base64-in-form-urlencoded route first, but
// Meta rejected it ("source file required") — /advideos expects a real
// multipart file_upload, not a base64-encoded `bytes` blob.

export interface MetaVideoUploadResult {
  id: string;
  success?: boolean;
}

/**
 * Upload an MP4 to /<ad-account>/advideos via multipart/form-data. Returns
 * the resulting video_id. Caller must then poll `getVideoEncodingStatus`
 * (or use `waitForVideoReady`) before referencing the video_id in an ad
 * creative — Meta's encoder takes 10-90s typically.
 *
 * @param mp4Bytes - the raw MP4 file contents
 * @param filename - filename to send to Meta (used in some places for
 *   display; doesn't affect the resulting video)
 * @param title - optional title shown in the Meta Asset Library
 */
export async function uploadAdVideo(
  mp4Bytes: Uint8Array,
  filename: string,
  title?: string,
): Promise<MetaVideoUploadResult> {
  const form = new FormData();
  // Meta expects the field name `source` for the multipart file upload.
  // The Blob's type matters — `video/mp4` is what Meta sniffs against.
  //
  // The `new Uint8Array(buf)` copy ensures the buffer is backed by a fresh
  // ArrayBuffer (not SharedArrayBuffer), satisfying TS's strict BlobPart type.
  const arrayBuf = new ArrayBuffer(mp4Bytes.byteLength);
  new Uint8Array(arrayBuf).set(mp4Bytes);
  form.append(
    "source",
    new Blob([arrayBuf], { type: "video/mp4" }),
    filename,
  );
  if (title) form.append("title", title);

  // NOTE: don't set Content-Type manually — letting fetch generate it
  // means the multipart boundary is correct. Setting "application/json"
  // (like metaFetch does by default) would break the upload.
  const url = `${BASE}/${adAccountId()}/advideos`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meta /advideos upload failed: ${res.status} ${text.slice(0, 800)}`);
  }
  const data = JSON.parse(text) as MetaVideoUploadResult;
  if (!data.id) {
    throw new Error(`Meta /advideos returned no id: ${text.slice(0, 400)}`);
  }
  return data;
}

export interface MetaVideoStatus {
  /** "ready" | "processing" | "error" — string because Meta has been known to add new values. */
  video_status: string;
  /** Present only when video_status === "error". */
  error_message?: string;
}

/** One-shot status check. Use `waitForVideoReady` when you actually need to poll. */
export async function getVideoEncodingStatus(videoId: string): Promise<MetaVideoStatus> {
  return metaFetch<MetaVideoStatus>(`/${videoId}`, {
    qs: { fields: "status" },
  }).then((raw) => {
    // Meta returns `{ status: { video_status: "...", processing_progress: ... } }`
    // when you query `fields=status`. Some API versions return `video_status`
    // at the top level. Normalize.
    const r = raw as unknown as { status?: { video_status?: string; error?: { message?: string } }; video_status?: string };
    const vs = r.status?.video_status ?? r.video_status ?? "unknown";
    const err = r.status?.error?.message;
    return { video_status: vs, error_message: err };
  });
}

/**
 * Poll `getVideoEncodingStatus` every `pollIntervalMs` until `video_status`
 * is "ready" or timeout. Returns the final status.
 *
 * Typical encoding takes 15-60s for a 15-second 1080×1920 H.264 file.
 * Default timeout 5 minutes — Meta has been known to take longer when
 * the platform is under load, but anything past 5 min usually means the
 * encoder hit an error.
 */
export async function waitForVideoReady(
  videoId: string,
  opts: { timeoutMs?: number; pollIntervalMs?: number; onTick?: (s: MetaVideoStatus) => void } = {},
): Promise<MetaVideoStatus> {
  const timeoutMs = opts.timeoutMs ?? 5 * 60 * 1000;
  const pollIntervalMs = opts.pollIntervalMs ?? 5000;
  const t0 = Date.now();
  // First check is immediate — sometimes Meta returns "ready" on the very
  // first poll if encoding finished before the upload response returned.
  while (Date.now() - t0 < timeoutMs) {
    const s = await getVideoEncodingStatus(videoId);
    opts.onTick?.(s);
    if (s.video_status === "ready") return s;
    if (s.video_status === "error") {
      throw new Error(`Meta video ${videoId} encoding failed: ${s.error_message ?? "no message"}`);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error(`Meta video ${videoId} did not become ready within ${timeoutMs}ms (last poll: still processing)`);
}
