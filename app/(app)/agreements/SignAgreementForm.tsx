"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignAgreementForm({ agreementId }: { agreementId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const trimmedName = name.trim();
  const canSubmit = agreed && trimmedName.length >= 3 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/agreements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId, signatureText: trimmedName })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 409) {
          setErr("You've already signed this agreement. Redirecting…");
          setTimeout(() => router.replace("/agreements"), 1500);
          return;
        }
        throw new Error(j.error || `request failed (${r.status})`);
      }
      // router.replace so the back button doesn't return to a stale form.
      router.replace("/agreements");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-navy-600">
        By typing your full legal name and clicking Sign below, you electronically sign this
        agreement.
      </p>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm text-navy-700">
          I have read and agree to this agreement.
        </span>
      </label>

      <div>
        <label className="label" htmlFor={`signature-name-${agreementId}`}>
          Type your full legal name
        </label>
        <input
          id={`signature-name-${agreementId}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={3}
          maxLength={120}
          autoComplete="off"
          className="input"
        />
      </div>

      <div>
        <button type="submit" disabled={!canSubmit} className="btn-primary">
          {busy ? "Signing…" : "Sign agreement"}
        </button>
      </div>

      <p className="text-xs text-navy-500">
        Your IP address and timestamp will be recorded as part of the signature.
      </p>

      {err && <p className="text-sm text-coral-700">{err}</p>}
    </form>
  );
}
