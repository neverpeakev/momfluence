import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplicationRow, { type ApplicationView } from "./ApplicationRow";

export const dynamic = "force-dynamic";

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  waitlisted: 1,
  approved: 2,
  rejected: 3,
  withdrawn: 4
};

const STATUS_LABEL: Record<string, string> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  waitlisted: "waitlisted",
  withdrawn: "withdrawn"
};

export default async function AdminApplicationsPage() {
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
          Your account is not an admin. If you need access, email
          support@momfluence.app.
        </p>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("offer_applications")
    .select(
      `
      id, status, application_data, submitted_at, reviewed_at, approved_at,
      reviewer_notes, rejected_reason,
      offers!inner(slug, title, brand, application_form_schema),
      applicant:momfluencers!momfluencer_id(email, display_name, instagram_handle),
      reviewer:momfluencers!reviewer_id(display_name, email)
      `
    )
    .order("submitted_at", { ascending: false });

  const applications = (rows ?? []) as unknown as ApplicationView[];

  const sorted = [...applications].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99;
    const sb = STATUS_ORDER[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  const counts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Applications</h1>
        <p className="mt-1 text-navy-600">
          Review and decide each pending application. Approved moms can generate tracking
          links for the offer.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className={`pill ${pillClass(key)}`}>
            {counts[key] ?? 0} {label}
          </span>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="card">
          <p className="text-sm text-navy-600">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => (
            <ApplicationRow key={a.id} application={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function pillClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "approved":
      return "bg-green-50 text-green-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    case "waitlisted":
      return "bg-stone-100 text-stone-700";
    case "withdrawn":
      return "bg-stone-100 text-stone-500";
    default:
      return "bg-navy-100 text-navy-700";
  }
}
