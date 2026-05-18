"use client";

import { useEffect, useRef } from "react";
import { fireLPSectionView, type LPSectionEventName } from "@/lib/funnel-lab/lp-events";

interface Props {
  /**
   * The fbq custom event to fire once this section is at least 50% visible
   * in the viewport for the first time. After firing once, the observer
   * disconnects — we never re-fire for a given section in a session.
   */
  event: LPSectionEventName;
  /** The section's children. */
  children: React.ReactNode;
  /** Optional className passthrough for layout. */
  className?: string;
  /** IntersectionObserver threshold; default 0.5 (50% visible). */
  threshold?: number;
}

/**
 * Wraps an LP section in an IntersectionObserver. The first time the section
 * crosses `threshold` (default 50%) into the viewport, fires the named
 * Meta custom event once and disconnects.
 *
 * Designed so each Section* component in components/landing/sections/
 * can be wrapped with one of these to get free funnel-depth tracking.
 *
 * Usage (JSX):
 *   LPSectionTracker event={LP_SECTION_EVENTS.HowItWorks}
 *     SectionHowItWorks ...
 *   /LPSectionTracker
 */
export default function LPSectionTracker({
  event,
  children,
  className,
  threshold = 0.5,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            fireLPSectionView(event);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [event, threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
