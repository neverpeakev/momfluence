import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export async function getVaultSecret(name: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("get_vault_secrets", { p_names: [name] });
  if (error) throw new Error(`Vault read failed for ${name}: ${error.message}`);
  if (!data || data.length === 0) return null;
  return (data[0] as { secret: string }).secret;
}

export async function getVaultSecrets(names: string[]): Promise<Record<string, string>> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("get_vault_secrets", { p_names: names });
  if (error) throw new Error(`Vault read failed: ${error.message}`);
  const out: Record<string, string> = {};
  for (const row of (data || []) as { name: string; secret: string }[]) {
    out[row.name] = row.secret;
  }
  return out;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
