"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  ATTR_COOKIE,
  ATTR_COOKIE_MAX_AGE,
  parseAttributionFromQuery,
  readAttributionFromCookies,
} from "@/lib/funnel-lab/attribution";
import { fireMetaViewContent } from "@/lib/meta-pixel";

interface Props {
  variant: string;
}

/**
 * Mounts on every /lp/[variant] page. Two responsibilities:
 *
 *   1. Capture the attribution chain into cookies on first touch so the
 *      signup + checkout downstream can read it without URL params.
 *   2. Fire Meta ViewContent — gives Meta an early-funnel engagement signal
 *      so the algorithm has more rungs on the optimization ladder (PR 3).
 *
 * Last-touch attribution model: if a user lands on a different LP later, the
 * variant cookie updates. (Flip to first-touch by gating on `existing.variant`.)
 */
export default function LPVisitTracker({ variant }: Props) {
  const sp = useSearchParams();
  const viewContentFiredRef = useRef(false);

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

    // Fire Meta ViewContent once per LP mount. The fbq queue inside
    // fbevents.js de-dupes within a single session, but we also guard
    // here so React strict-mode double-mounts don't trigger a noisy
    // second fire (browser inspection only — Meta still dedupes on its end).
    if (!viewContentFiredRef.current) {
      viewContentFiredRef.current = true;
      fireMetaViewContent(variant, fromQuery.creative);
    }
  }, [variant, sp]);

  return null;
}
