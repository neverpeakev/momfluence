import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("momfluencers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Your profile</h1>
        <p className="mt-1 text-navy-600">This is what we use to vet your account and pay you.</p>
      </div>
      <ProfileForm initial={profile ?? {}} email={user.email ?? ""} />
    </div>
  );
}
