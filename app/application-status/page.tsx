import { Suspense } from "react";
import ApplicationStatusInner from "./ApplicationStatusInner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Post-checkout "reviewing your application" page (2026-05-25).
 *
 * Stripe success_url lands here with ?session_id=... — we poll the
 * /api/applications/status endpoint every 3 seconds. The Stripe webhook
 * upserts the momfluencer row with status='approved' + membership_status=
 * 'active' within seconds of receiving checkout.session.completed.
 *
 * The page intentionally lingers for a minimum of ~15 seconds even if
 * the backend has already approved, to make the application FEEL like
 * it's being reviewed (psychological reframe — this is the same reason
 * a job application doesn't auto-respond in 0ms).
 *
 * Once approved, redirect to /welcome which is the celebration screen.
 */
export default function ApplicationStatusPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-3xl text-navy-900">Reviewing your application…</h1>
        </main>
      }
    >
      <ApplicationStatusInner />
    </Suspense>
  );
}
