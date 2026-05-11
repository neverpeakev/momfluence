import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { VARIANTS, type FunnelVariant } from "@/lib/funnel-lab/variants";

export const dynamic = "force-dynamic";

const PRICE_USD_PER_MEMBERSHIP = 5;

interface VariantRollup {
  signups: number;
  active: number;
  cancelled: number;
  revenueUsd: number;
  byCreative: Map<string, { signups: number; active: number; revenueUsd: number }>;
}

async function fetchStripeRollup(): Promise<Map<string, VariantRollup> | { error: string }> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { error: "STRIPE_SECRET_KEY missing — set in Vercel env to enable rollups." };

  const stripe = new Stripe(secret.trim(), { maxNetworkRetries: 1, timeout: 15000 });
  const out = new Map<string, VariantRollup>();

  // Stripe API: subscriptions list, expand customers. We page through up to 5 batches
  // of 100 = 500 most-recent subs. v1 of the lab — when this caps, we add a cursor.
  let starting_after: string | undefined;
  let pages = 0;
  try {
    while (pages < 5) {
      const batch: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        limit: 100,
        starting_after,
        expand: ["data.customer"],
      });

      for (const sub of batch.data) {
        const variant = sub.metadata?.lp_variant;
        if (!variant) continue;
        const creative = sub.metadata?.creative_id ?? "(none)";

        const isActive = sub.status === "active" || sub.status === "trialing";
        const isCancelled = sub.status === "canceled" || sub.status === "incomplete_expired";

        const bucket: VariantRollup = out.get(variant) ?? {
          signups: 0,
          active: 0,
          cancelled: 0,
          revenueUsd: 0,
          byCreative: new Map(),
        };
        bucket.signups += 1;
        if (isActive) bucket.active += 1;
        if (isCancelled) bucket.cancelled += 1;
        bucket.revenueUsd += isActive ? PRICE_USD_PER_MEMBERSHIP : 0;

        const cv = bucket.byCreative.get(creative) ?? { signups: 0, active: 0, revenueUsd: 0 };
        cv.signups += 1;
        if (isActive) cv.active += 1;
        if (isActive) cv.revenueUsd += PRICE_USD_PER_MEMBERSHIP;
        bucket.byCreative.set(creative, cv);

        out.set(variant, bucket);
      }

      if (!batch.has_more) break;
      starting_after = batch.data[batch.data.length - 1]?.id;
      pages += 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return { error: `Stripe query failed: ${message}` };
  }

  return out;
}

export default async function FunnelLabPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("momfluencers")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) {
    return (
      <div className="card">
        <h1 className="text-2xl">Admin only</h1>
        <p className="mt-2 text-sm text-navy-600">
          Your account is not an admin. If you need access, email support@momfluence.app.
        </p>
      </div>
    );
  }

  const rollup = await fetchStripeRollup();
  const errorMsg = !(rollup instanceof Map) ? rollup.error : null;
  const data = rollup instanceof Map ? rollup : new Map<string, VariantRollup>();

  // Aggregate totals across variants
  let totalSignups = 0;
  let totalActive = 0;
  let totalRevenue = 0;
  for (const b of data.values()) {
    totalSignups += b.signups;
    totalActive += b.active;
    totalRevenue += b.revenueUsd;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-coral-600 font-semibold">
          Funnel Lab · v1
        </p>
        <h1 className="text-3xl text-navy-900">Variant performance</h1>
        <p className="mt-2 text-sm text-navy-600">
          Live rollup from Stripe subscriptions, grouped by{" "}
          <span className="font-mono">lp_variant</span> metadata. Visit-level
          data (CR/CPA) requires the optional migration in{" "}
          <span className="font-mono">supabase/migrations/</span>.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-coral-50 p-4 ring-1 ring-coral-200">
          <p className="text-sm font-semibold text-coral-700">Rollup unavailable</p>
          <p className="mt-1 text-sm text-navy-700">{errorMsg}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total signups (attributed)" value={String(totalSignups)} />
        <StatTile label="Currently active" value={String(totalActive)} />
        <StatTile label="MRR (active × $5)" value={`$${totalRevenue.toFixed(0)}`} />
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-navy-100">
        <table className="w-full text-sm">
          <thead className="bg-navy-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-navy-700">Variant</th>
              <th className="px-4 py-3 text-left font-semibold text-navy-700">Slug / LP</th>
              <th className="px-4 py-3 text-right font-semibold text-navy-700">Signups</th>
              <th className="px-4 py-3 text-right font-semibold text-navy-700">Active</th>
              <th className="px-4 py-3 text-right font-semibold text-navy-700">Cancel %</th>
              <th className="px-4 py-3 text-right font-semibold text-navy-700">MRR</th>
              <th className="px-4 py-3 text-left font-semibold text-navy-700">Hypothesis</th>
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((v) => {
              const b = data.get(v.slug);
              const signups = b?.signups ?? 0;
              const active = b?.active ?? 0;
              const cancelled = b?.cancelled ?? 0;
              const cancelRate = signups > 0 ? Math.round((cancelled / signups) * 100) : 0;
              const mrr = b?.revenueUsd ?? 0;
              return (
                <tr key={v.slug} className="border-t border-navy-100">
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-navy-900">{v.label}</div>
                    <div className="mt-1 inline-block rounded-full bg-coral-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coral-700 ring-1 ring-coral-200">
                      {v.angle}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/lp/${v.slug}`} target="_blank" className="font-mono text-xs text-coral-600 hover:text-coral-700">
                      /lp/{v.slug} →
                    </Link>
                    <div className="mt-1 text-[10px] text-navy-500">
                      primary creative: <span className="font-mono">{v.primaryCreativeId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono align-top">{signups}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 align-top">{active}</td>
                  <td className="px-4 py-3 text-right font-mono align-top">
                    <span className={cancelRate > 50 ? "text-coral-700" : "text-navy-700"}>
                      {cancelRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono align-top">${mrr.toFixed(0)}</td>
                  <td className="px-4 py-3 text-xs italic text-navy-600 align-top">{v.hypothesis}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="rounded-xl bg-white p-4 ring-1 ring-navy-100">
        <summary className="cursor-pointer text-sm font-semibold text-navy-900">
          By creative breakdown (paste-friendly)
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded bg-navy-50 p-3 text-[10px] text-navy-800">
{JSON.stringify(
  Object.fromEntries(
    Array.from(data.entries()).map(([slug, b]) => [
      slug,
      {
        signups: b.signups,
        active: b.active,
        cancelled: b.cancelled,
        revenueUsd: b.revenueUsd,
        byCreative: Object.fromEntries(b.byCreative),
      },
    ])
  ),
  null,
  2
)}
        </pre>
      </details>

      <div className="rounded-2xl bg-navy-50 p-5 ring-1 ring-navy-100">
        <h2 className="text-base font-semibold text-navy-900">How attribution works</h2>
        <ol className="mt-2 space-y-1 text-sm text-navy-700">
          <li>1. Ad clicks land on <span className="font-mono">/lp/&lt;variant&gt;?c=&lt;creativeId&gt;</span>.</li>
          <li>2. LPVisitTracker writes <span className="font-mono">mf_lp</span> + <span className="font-mono">mf_creative</span> cookies (30-day window).</li>
          <li>3. The signup form reads URL params + cookies, sends to <span className="font-mono">/api/checkout/create</span>.</li>
          <li>4. Checkout session is created with <span className="font-mono">metadata.lp_variant</span> + <span className="font-mono">creative_id</span>.</li>
          <li>5. Subscription inherits the metadata. This page reads it back via Stripe API.</li>
        </ol>
      </div>

      <p className="text-xs text-navy-400">
        Showing data from up to 500 most-recent Stripe subscriptions. Older periods require pagination — add a cursor when needed.
      </p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-navy-100">
      <p className="text-[10px] uppercase tracking-widest text-navy-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-navy-900">{value}</p>
    </div>
  );
}

// Silence unused-import warning for the type
export type _ = FunnelVariant;
