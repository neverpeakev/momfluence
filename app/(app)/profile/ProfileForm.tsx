"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FOLLOWER_BANDS = ["500-1k", "1k-5k", "5k-10k", "10k-25k", "25k-50k", "50k-100k", "100k+"];

type ProfileShape = {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  facebook_handle?: string | null;
  city?: string | null;
  state?: string | null;
  follower_band?: string | null;
  payout_method?: string | null;
  payout_handle?: string | null;
};

export default function ProfileForm({ initial, email }: { initial: ProfileShape; email: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileShape>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function update<K extends keyof ProfileShape>(k: K, v: ProfileShape[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error || "failed");
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First name"><input className="input" value={form.first_name ?? ""} onChange={(e) => update("first_name", e.target.value)} /></Field>
        <Field label="Last name"><input className="input" value={form.last_name ?? ""} onChange={(e) => update("last_name", e.target.value)} /></Field>
      </div>
      <Field label="Email"><input className="input bg-navy-50" value={email} readOnly /></Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Instagram"><input className="input" placeholder="@yourhandle" value={form.instagram_handle ?? ""} onChange={(e) => update("instagram_handle", e.target.value)} /></Field>
        <Field label="TikTok"><input className="input" placeholder="@yourhandle" value={form.tiktok_handle ?? ""} onChange={(e) => update("tiktok_handle", e.target.value)} /></Field>
        <Field label="Facebook"><input className="input" placeholder="profile or page url" value={form.facebook_handle ?? ""} onChange={(e) => update("facebook_handle", e.target.value)} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="City"><input className="input" value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} /></Field>
        <Field label="State"><input className="input" placeholder="FL" maxLength={2} value={form.state ?? ""} onChange={(e) => update("state", e.target.value.toUpperCase())} /></Field>
        <Field label="Follower band">
          <select className="input" value={form.follower_band ?? ""} onChange={(e) => update("follower_band", e.target.value)}>
            <option value="">Select</option>
            {FOLLOWER_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
      </div>

      <div className="border-t border-navy-100 pt-4">
        <h3 className="text-lg">Payout method</h3>
        <p className="text-sm text-navy-500">How you want to be paid. You can change this later.</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Field label="Method">
            <select className="input" value={form.payout_method ?? "unset"} onChange={(e) => update("payout_method", e.target.value)}>
              <option value="unset">Choose…</option>
              <option value="paypal">PayPal</option>
              <option value="venmo">Venmo</option>
              <option value="ach">ACH (bank transfer)</option>
              <option value="check">Mailed check</option>
            </select>
          </Field>
          <Field label="Handle / account">
            <input className="input" placeholder={form.payout_method === "ach" ? "Routing/Account (we'll DM you)" : "@yourhandle or email"} value={form.payout_handle ?? ""} onChange={(e) => update("payout_handle", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save"}</button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
        {err && <span className="text-sm text-coral-700">{err}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
