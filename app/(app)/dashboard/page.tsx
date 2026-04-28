import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/margin";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: earnings }, { data: links }, { data: requiredAgreements }] = await Promise.all([
    supabase.from("momfluencers").select("status, first_name, display_name, payout_method").eq("id", user.id).maybeSingle(),
    supabase.from("momfluencer_earnings").select("*").eq("momfluencer_id", user.id).maybeSingle(),
    supabase.from("tracking_links").select("id").eq("momfluencer_id", user.id),
    supabase.from("agreements").select("id, slug, version, title").eq("required", true)
  ]);

  const { data: signed } = await supabase
    .from("agreement_signatures")
    .select("agreement_id")
    .eq("momfluencer_id", user.id);

  const signedIds = new Set((signed ?? []).map((s) => s.agreement_id));
  const unsigned = (requiredAgreements ?? []).filter((a) => !signedIds.has(a.id));

  const greeting = profile?.first_name || profile?.display_name || "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl text-navy-900">Hi, {greeting} 👋</h1>
        <p className="mt-2 text-navy-600">
          {profile?.status === "pending"
            ? "Your account is in review — most approvals are same-day. You can still poke around the catalog."
            : "Here's where you stand this week."}
        </p>
      </div>

      {unsigned.length > 0 && (
        <div className="card border-l-4 border-coral-500">
          <h3 className="text-lg">Sign your agreements before generating links</h3>
          <p className="mt-1 text-sm text-navy-600">
            You have {unsigned.length} required agreement{unsigned.length > 1 ? "s" : ""} to sign.
          </p>
          <Link href="/agreements" className="btn-primary mt-4">Review &amp; sign</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Earned" value={formatCents(earnings?.earned_cents ?? 0)} />
        <Stat label="Pending" value={formatCents(earnings?.pending_cents ?? 0)} />
        <Stat label="Paid out" value={formatCents(earnings?.paid_cents ?? 0)} />
        <Stat label="Active links" value={(links?.length ?? 0).toString()} />
      </div>

      <div className="card">
        <h3 className="text-lg">Next steps</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li>→ <Link href="/offers">Browse this week's offers</Link></li>
          <li>→ <Link href="/profile">Set your payout method</Link>{profile?.payout_method && profile.payout_method !== "unset" ? " ✓" : ""}</li>
          <li>→ <Link href="/agreements">Review program agreements</Link>{unsigned.length === 0 ? " ✓" : ""}</li>
        </ul>
      </div>
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
