"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminApprovalControls({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(status: "approved" | "suspended") {
    setBusy(true);
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button disabled={busy} className="btn-primary text-xs px-3 py-1" onClick={() => set("approved")}>
        Approve
      </button>
      <button disabled={busy} className="btn-ghost text-xs px-3 py-1" onClick={() => set("suspended")}>
        Reject
      </button>
    </div>
  );
}
