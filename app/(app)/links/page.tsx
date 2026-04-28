import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  token: string;
  custom_label: string | null;
  created_at: string;
  offers: { title: string; brand: string | null; slug: string };
};

export default async function LinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("tracking_links")
    .select("id, token, custom_label, created_at, offers!inner(title, brand, slug)")
    .eq("momfluencer_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) => r.id);
  const { data: clicks } = await supabase
    .from("clicks")
    .select("tracking_link_id")
    .in("tracking_link_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data: convs } = await supabase
    .from("conversions")
    .select("tracking_link_id, status")
    .in("tracking_link_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const clickCount = new Map<string, number>();
  (clicks ?? []).forEach((c) => clickCount.set(c.tracking_link_id, (clickCount.get(c.tracking_link_id) ?? 0) + 1));
  const convCount = new Map<string, number>();
  (convs ?? []).forEach((c) => convCount.set(c.tracking_link_id, (convCount.get(c.tracking_link_id) ?? 0) + 1));

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">My links</h1>

      {(rows ?? []).length === 0 ? (
        <div className="card text-sm text-navy-600">
          You haven't generated any tracking links yet. Head to <a href="/offers">Offers</a> to grab one.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-navy-500">
              <tr>
                <th className="py-2">Offer</th>
                <th>Short link</th>
                <th>Label</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(rows as Row[] | null)?.map((r) => (
                <tr key={r.id} className="border-t border-navy-100">
                  <td className="py-3">
                    <p className="font-medium">{r.offers.title}</p>
                    <p className="text-xs text-navy-500">{r.offers.brand}</p>
                  </td>
                  <td>
                    <code className="rounded bg-navy-50 px-2 py-1 text-xs">{baseUrl}/t/{r.token}</code>
                  </td>
                  <td className="text-xs">{r.custom_label || "—"}</td>
                  <td>{clickCount.get(r.id) ?? 0}</td>
                  <td>{convCount.get(r.id) ?? 0}</td>
                  <td className="text-xs text-navy-500">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
