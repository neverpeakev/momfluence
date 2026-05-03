import { getServiceClient } from "./supabase.ts";

export interface SyncRunFields {
  rows_fetched?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_skipped?: number;
  error_message?: string | null;
  raw_response_sample?: unknown;
}

export async function startSyncRun(
  networkId: string,
  syncType: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<string> {
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
  return data.id as string;
}

export async function completeSyncRun(
  runId: string,
  status: "success" | "failed" | "partial",
  fields: SyncRunFields,
): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("network_sync_runs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      ...fields,
    })
    .eq("id", runId);
}

export async function markCredentialSyncResult(
  networkId: string,
  errorMessage: string | null,
): Promise<void> {
  const supabase = getServiceClient();
  const update: Record<string, unknown> = {
    last_attempted_sync_at: new Date().toISOString(),
    last_error: errorMessage,
  };
  if (errorMessage === null) {
    update.last_successful_sync_at = new Date().toISOString();
  }
  await supabase.from("network_credentials").update(update).eq("network_id", networkId);
}

export async function lookupTrackingLinkByToken(token: string): Promise<
  | { id: string; offer_id: string; momfluencer_id: string }
  | null
> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("tracking_links")
    .select("id, offer_id, momfluencer_id")
    .eq("token", token)
    .maybeSingle();
  return data as { id: string; offer_id: string; momfluencer_id: string } | null;
}

export async function getOfferMarginBps(offerId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("offers")
    .select("margin_bps")
    .eq("id", offerId)
    .single();
  return ((data as { margin_bps: number } | null)?.margin_bps) ?? 1000;
}

export function calculatePayoutSplit(networkPayoutCents: number, marginBps: number): {
  momPayoutCents: number;
  marginCents: number;
} {
  const momPayoutCents = Math.floor((networkPayoutCents * (10000 - marginBps)) / 10000);
  const marginCents = networkPayoutCents - momPayoutCents;
  return { momPayoutCents, marginCents };
}
