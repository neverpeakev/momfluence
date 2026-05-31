import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: m } = await supabase
    .from("momfluencers")
    .select("status, membership_status, is_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  // Membership gate: anyone reaching an /(app) route must either be an admin
  // or have an active/trialing Stripe subscription. Users who signed up but
  // never finished checkout land here with membership_status='inactive' and
  // get bounced to the paywall.
  const paid = ["trialing", "active"].includes(m?.membership_status ?? "");
  if (!m?.is_admin && !paid) {
    redirect("/paywall");
  }

  // We intentionally do NOT gate on status='pending' — admin approval is
  // separate from payment, and pending+paid users still see the dashboard
  // (with an "in review" nudge rendered by dashboard/page.tsx).

  return (
    <div className="min-h-screen">
      <Nav isAdmin={!!m?.is_admin} email={m?.email ?? user.email ?? undefined} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {m?.status === "suspended" && (
          <div className="card mb-6 border-l-4 border-coral-600">
            <p className="text-sm">
              Your account is currently suspended. Please email{" "}
              <a href="mailto:support@momfluence.app">support@momfluence.app</a>.
            </p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
