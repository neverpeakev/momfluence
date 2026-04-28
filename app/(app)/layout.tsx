import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: m } = await supabase
    .from("momfluencers")
    .select("status, is_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  // gate dashboard behind onboarding once profile exists but is still pending+incomplete
  // (we let them in pending — onboarding nudge shows on the dashboard itself)

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
