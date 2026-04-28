import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/margin";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: earnings } = await supabase
    .from("momfluencer_earnings")
    .select("*")
    .eq("momfluencer_id", user.id)
    .maybeSingle();

  const { data: convs } = await supabase
    .from("conversions")
    .select("id, status, momfluencer_payout_cents, created_at, tracking_links!inner(token, offers!inner(title, brand))")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: payouts } = await supabase
    .from("payouts")
    .select("*")
    .eq("momfluencer_id", user.id)
    .order("initiated_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Earnings & payouts</h1>
        <p className="mt-1 text-navy-600">NET-30 from approval. $50 minimum. Carries over otherwise.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Earned" value={formatCents(earnings?.earned_cents ?? 0)} />
        <Stat label="Pending" value={formatCents(earnings?.pending_cents ?? 0)} />
        <Stat label="Paid" value={formatCents(earnings?.paid_cents ?? 0)} />
      </div>

      <section>
        <h2 className="text-2xl mb-4">Recent conversions</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-navy-500">
              <tr><th className="py-2">Date</th><th>Offer</th><th>Status</th><th>You earn</th></tr>
            </thead>
            <tbody>
              {(convs ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-navy-100">
                  <td className="py-3 text-xs text-navy-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>{c.tracking_links?.offers?.title}<p className="text-xs text-navy-500">{c.tracking_links?.offers?.brand}</p></td>
                  <td><StatusPill status={c.status} /></td>
                  <td className="font-medium">{formatCents(c.momfluencer_payout_cents)}</td>
                </tr>
              ))}
              {(!convs || convs.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-sm text-navy-500">No conversions yet — share your link.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl mb-4">Past payouts</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-navy-500">
              <tr><th className="py-2">Initiated</th><th>Method</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(payouts ?? []).map((p) => (
                <tr key={p.id} className="border-t border-navy-100">
                  <td className="py-3 text-xs text-navy-500">{new Date(p.initiated_at).toLocaleDateString()}</td>
                  <td className="capitalize">{p.method}</td>
                  <td className="font-medium">{formatCents(p.amount_cents)}</td>
                  <td><StatusPill status={p.status} /></td>
                </tr>
              ))}
              {(!payouts || payouts.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-sm text-navy-500">No payouts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-navy-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
function StatusPill({ status }: { status: string }) {
  const cls =
    status === "paid" ? "bg-green-100 text-green-800"
    : status === "approved" ? "bg-blue-100 text-blue-800"
    : status === "pending" || status === "queued" ? "bg-yellow-100 text-yellow-800"
    : status === "rejected" || status === "reversed" || status === "failed" ? "bg-coral-100 text-coral-800"
    : "bg-navy-100 text-navy-700";
  return <span className={`pill ${cls} capitalize`}>{status}</span>;
}
