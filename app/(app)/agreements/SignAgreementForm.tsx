"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignAgreementForm({ agreementId }: { agreementId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return setErr("Please confirm you've read and agree.");
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/agreements/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agreementId, signatureText: name })
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error || "failed");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,auto] md:items-end">
      <div>
        <label className="label">Type your full legal name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} />
      </div>
      <label className="text-sm flex items-center gap-2 mt-2 md:mt-0">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        I've read and agree.
      </label>
      <button disabled={busy || !agreed || name.length < 3} className="btn-primary">
        {busy ? "Signing…" : "Sign"}
      </button>
      {err && <p className="md:col-span-3 text-sm text-coral-700">{err}</p>}
    </form>
  );
}
