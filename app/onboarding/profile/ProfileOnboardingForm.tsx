"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Initial = {
  display_name: string;
  instagram_handle: string;
  tiktok_handle: string;
};

function stripAt(value: string): string {
  return value.trim().replace(/^@+/, "");
}

export default function ProfileOnboardingForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [instagram, setInstagram] = useState(initial.instagram_handle);
  const [tiktok, setTiktok] = useState(initial.tiktok_handle);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErr("Display name is required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setErr("Your session expired. Please sign in again.");
      return;
    }

    const { error } = await supabase
      .from("momfluencers")
      .update({
        display_name: trimmedName,
        instagram_handle: stripAt(instagram) || null,
        tiktok_handle: stripAt(tiktok) || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-4">
      <div>
        <label className="label" htmlFor="display_name">
          Display name <span className="text-coral-600">*</span>
        </label>
        <input
          id="display_name"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input"
          placeholder="What you'd like brands to see"
          maxLength={80}
        />
      </div>

      <div>
        <label className="label" htmlFor="instagram_handle">Instagram (optional)</label>
        <input
          id="instagram_handle"
          type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className="input"
          placeholder="@yourhandle"
          maxLength={60}
        />
      </div>

      <div>
        <label className="label" htmlFor="tiktok_handle">TikTok (optional)</label>
        <input
          id="tiktok_handle"
          type="text"
          value={tiktok}
          onChange={(e) => setTiktok(e.target.value)}
          className="input"
          placeholder="@yourhandle"
          maxLength={60}
        />
      </div>

      {err && <p className="text-sm text-coral-700">{err}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full no-underline">
        {loading ? "Saving…" : "Continue to dashboard"}
      </button>
    </form>
  );
}
