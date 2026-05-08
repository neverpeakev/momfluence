import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileOnboardingForm from "./ProfileOnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingProfilePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/onboarding/profile");
  }

  const { data: profile } = await supabase
    .from("momfluencers")
    .select("display_name, instagram_handle, tiktok_handle, membership_status")
    .eq("id", user.id)
    .maybeSingle();

  // No row yet, or membership not active -> bounce to signup so they can pay.
  if (!profile || profile.membership_status !== "active") {
    redirect("/signup");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl">Set up your profile</h1>
      <p className="mt-2 text-navy-600">
        Just the basics. You can edit any of this later from your profile settings.
      </p>

      <ProfileOnboardingForm
        initial={{
          display_name: profile.display_name ?? "",
          instagram_handle: profile.instagram_handle ?? "",
          tiktok_handle: profile.tiktok_handle ?? ""
        }}
      />
    </main>
  );
}
