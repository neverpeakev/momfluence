import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/margin";
import AdminApprovalControls from "./AdminApprovalControls";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) {
    return (
      <div className="card">
        <h1 className="text-2xl">Admin only</h1>
        <p className="mt-2 text-sm text-navy-600">Your account is not an admin. If you need access, email support@momfluence.app.</p>
      </div>
    );
  }

  const [{ data: pending }, { data: approved }, { count: linkCount }, { count: clickCount }, { count: convCount }] =
    await Promise.all([
      supabase.from("momfluencers").select("id, email, instagram_handle, city, state, follower_band, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
      supabase.from("momfluencers").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("tracking_links").select("id", { count: "exact", head: true }),
      supabase.from("clicks").select("id", { count: "exact", head: true }),
      supabase.from("conversions").select("id", { count: "exact", head: true })
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Admin</h1>
        <p className="mt-1 text-navy-600">Approvals, sync, and platform stats.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Approved momfluencers" value={(approved as any)?.count?.toString() ?? "—"} />
        <Stat label="Tracking links" value={linkCount?.toString() ?? "—"} />
        <Stat label="Clicks" value={clickCount?.toString() ?? "—"} />
        <Stat label="Conversions" value={convCount?.toString() ?? "—"} />
      </div>

      <section>
        <h2 className="text-2xl mb-3">Pending approvals ({(pending ?? []).length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-navy-500">
              <tr><th className="py-2">Email</th><th>IG</th><th>City</th><th>State</th><th>Followers</th><th>Joined</th><th>Action</th></tr>
            </thead>
            <tbody>
              {(pending ?? []).map((p) => (
                <tr key={p.id} className="border-t border-navy-100">
                  <td className="py-3">{p.email}</td>
                  <td>{p.instagram_handle || "—"}</td>
                  <td>{p.city || "—"}</td>
                  <td>{p.state || "—"}</td>
                  <td>{p.follower_band || "—"}</td>
                  <td className="text-xs text-navy-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td><AdminApprovalControls id={p.id} /></td>
                </tr>
              ))}
              {(!pending || pending.length === 0) && (
                <tr><td colSpan={7} className="py-6 text-center text-sm text-navy-500">No pending applications.</td></tr>
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
