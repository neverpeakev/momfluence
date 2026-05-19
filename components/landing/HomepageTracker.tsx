"use client";

import { useEffect, useRef } from "react";
import { fireMetaViewContent } from "@/lib/meta-pixel";

/**
 * Fires a Meta `ViewContent` event when the public homepage mounts.
 *
 * Why this exists: the homepage at `/` is a top-of-funnel entry point —
 * a portion of ad clicks point directly at `/` instead of a `/lp/<variant>`
 * slug, and any organic search/direct traffic lands here too. Without this
 * tracker, Meta's optimization algo loses a critical rung on the funnel
 * ladder for homepage entries: it sees `PageView` (auto-fired by the base
 * pixel) but no qualified `ViewContent`, so it can't tell whether the user
 * engaged with the homepage as a *landing* surface vs just bounced off.
 *
 * Treats `home` as a sentinel variant slug for funnel-lab attribution —
 * homepage signup CTAs carry `?lp=home` so the funnel-lab dashboard can
 * distinguish direct-from-homepage signups from `/lp/<variant>` signups.
 *
 * Uses a useRef firedRef guard so React Strict Mode's double-mount in dev
 * doesn't fire ViewContent twice. The dependency array is `[]` (mount-only)
 * because we want a single qualified ViewContent per homepage entry — repeat
 * homepage visits within the same SPA session would re-fire on next mount
 * (which is fine — Meta dedupes intra-session anyway).
 *
 * Render this once at the top of `app/page.tsx`. The component returns null;
 * it's purely a side-effect-on-mount hook holder.
 */
export default function HomepageTracker() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    fireMetaViewContent("home");
  }, []);

  return null;
}
