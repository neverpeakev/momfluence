"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Phase = "reviewing" | "approved" | "rejected";

// Minimum dwell time on the review screen even if the backend is faster.
// 18 seconds is enough to feel like real review without testing user
// patience. Tuned to feel "they're actually looking at this".
const MIN_REVIEW_MS = 18_000;

// Total poll budget — if backend hasn't flipped to approved by this, we
// still send them to /welcome (graceful degradation; the webhook may be
// slow but session.completed reliably fires within seconds).
const MAX_REVIEW_MS = 60_000;

const POLL_INTERVAL_MS = 3_000;

const REVIEW_STEPS = [
  "Reviewing your socials…",
  "Verifying your location…",
  "Cross-checking the curated brand list against your audience…",
  "Almost done — finalizing your spot…",
] as const;

export default function ApplicationStatusInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [phase, setPhase] = useState<Phase>("reviewing");
  const [stepIdx, setStepIdx] = useState(0);
  const [reason, setReason] = useState<string | null>(null);

  // Rotate review step copy every 4-5 seconds so the user feels progress.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIdx((i) => (i + 1) % REVIEW_STEPS.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  // Poll the backend for the actual approval status. Don't redirect until
  // BOTH conditions: (a) backend says approved AND (b) at least MIN_REVIEW_MS
  // has elapsed. This ensures the wait feels genuine, even on fast webhooks.
  useEffect(() => {
    const startedAt = Date.now();
    let approvedAt: number | null = null;
    let stopped = false;

    async function poll() {
      try {
        const res = await fetch("/api/applications/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { state: Phase; reason?: string };
        if (data.state === "approved" && approvedAt === null) {
          approvedAt = Date.now();
        }
        if (data.state === "rejected") {
          setPhase("rejected");
          setReason(data.reason ?? null);
          stopped = true;
        }
      } catch {
        // ignore — try again next tick
      }
    }

    // Initial poll, then interval
    void poll();
    const pollId = window.setInterval(poll, POLL_INTERVAL_MS);

    // Tick to check if we're past the minimum dwell AND backend has approved
    const tickId = window.setInterval(() => {
      if (stopped) return;
      const elapsed = Date.now() - startedAt;
      const backendApproved = approvedAt !== null;
      const minDwellMet = elapsed >= MIN_REVIEW_MS;
      const timeoutHit = elapsed >= MAX_REVIEW_MS;

      if ((backendApproved && minDwellMet) || timeoutHit) {
        stopped = true;
        setPhase("approved");
        const target = sessionId
          ? `/welcome?session_id=${encodeURIComponent(sessionId)}&accepted=1`
          : "/welcome?accepted=1";
        // tiny final pause so the user sees the "Accepted!" beat before redirect
        window.setTimeout(() => router.replace(target), 1200);
      }
    }, 1000);

    return () => {
      stopped = true;
      window.clearInterval(pollId);
      window.clearInterval(tickId);
    };
  }, [router, sessionId]);

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      {phase === "reviewing" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy-900">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-coral-300 border-t-transparent" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-coral-600">
            Application received
          </p>
          <h1 className="mt-2 text-3xl text-navy-900">Reviewing your application…</h1>
          <p className="mt-4 text-base text-navy-700">{REVIEW_STEPS[stepIdx]}</p>
          <p className="mt-8 text-sm text-navy-500">
            Hang tight. We&apos;ll let you know in a moment. Don&apos;t close this tab.
          </p>
        </>
      )}

      {phase === "approved" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-coral-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-coral-600">
            Accepted
          </p>
          <h1 className="mt-2 text-3xl text-navy-900">You&apos;re in.</h1>
          <p className="mt-4 text-base text-navy-700">Taking you to your dashboard…</p>
        </>
      )}

      {phase === "rejected" && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-500">
            Application reviewed
          </p>
          <h1 className="mt-2 text-3xl text-navy-900">Not a fit right now.</h1>
          <p className="mt-4 text-base text-navy-700">
            {reason || "We couldn't verify your application details."} Your $5 is being refunded — you&apos;ll see it back on your card within 5-10 business days.
          </p>
          <p className="mt-6 text-sm text-navy-600">
            If you think this was a mistake, email{" "}
            <a href="mailto:hello@momfluence.app" className="text-coral-600 hover:text-coral-700">
              hello@momfluence.app
            </a>
            .
          </p>
        </>
      )}
    </main>
  );
}
