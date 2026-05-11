"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ATTR_COOKIE,
  ATTR_COOKIE_MAX_AGE,
  parseAttributionFromQuery,
  readAttributionFromCookies,
} from "@/lib/funnel-lab/attribution";

interface Props {
  variant: string;
}

/**
 * Mounts on every /lp/[variant] page. Captures the attribution chain into cookies
 * on first touch so the signup + checkout downstream can read it without needing
 * URL params to survive the auth round-trip.
 *
 * Last-touch model: if a user lands on a different LP later, the variant cookie
 * updates. (Flip to first-touch by gating on `existing.variant`.)
 */
export default function LPVisitTracker({ variant }: Props) {
  const sp = useSearchParams();

  useEffect(() => {
    const fromQuery = parseAttributionFromQuery(sp);
    const existing = readAttributionFromCookies();

    const setCookie = (k: string, v: string) => {
      document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=${ATTR_COOKIE_MAX_AGE}; SameSite=Lax`;
    };

    setCookie(ATTR_COOKIE.variant, variant);

    if (fromQuery.creative) {
      setCookie(ATTR_COOKIE.creative, fromQuery.creative);
    }

    if (!existing.firstSeen) {
      setCookie(ATTR_COOKIE.firstSeen, new Date().toISOString());
    }
  }, [variant, sp]);

  return null;
}
