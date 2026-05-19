/**
 * Diagnostic endpoint for the server-side Meta CAPI Purchase path.
 *
 * Why: PR #36 shipped fireServerSidePurchase() and wired it into the Stripe
 * webhook handler. That code path only fires when a real Stripe
 * checkout.session.completed event arrives — so until we get fresh organic
 * traffic, the new code is untested in production.
 *
 * This endpoint lets an admin invoke fireServerSidePurchase directly with
 * a real momfluencer's data (default: kelly.curphey@gmail.com), bypassing
 * the Stripe webhook entirely. Surface evidence:
 *   - Vercel runtime logs:  "[meta-capi] Purchase event sent (event_id=...)"
 *   - JSON response:        { ok, eventId, metaStatus, metaBody }
 *   - Meta Events Manager:  Test Events tab (if testEventCode passed) OR
 *                           Overview Purchase row (24-48h aggregation lag)
 *
 * Auth: admin only (checks momfluencers.is_admin), same pattern as
 * /api/optimizer/launch.
 *
 * Body:
 *   {
 *     email?:        string   // default "kelly.curphey@gmail.com"
 *     sessionId?:    string   // default "test_capi_<unix_ms>"
 *     valueUsd?:     number   // default 5.0 (matches /welcome browser pixel)
 *     testEventCode?: string  // REQUIRED (see below). When set, Meta routes
 *                              // events to Test Events tab — zero impact on
 *                              // production aggregates / Ads Manager / algo.
 *     confirmProductionPollution?: true  // explicit opt-out of the testEventCode
 *                              // requirement. Use ONLY when you specifically need
 *                              // to verify the production CAPI path end-to-end and
 *                              // accept that this Purchase event will hit the
 *                              // production Pixel counter.
 *   }
 *
 * WHY testEventCode IS REQUIRED BY DEFAULT (2026-05-19):
 * Calling this endpoint without a testEventCode fires a real Purchase event
 * against the production Pixel — Meta has no way to distinguish it from a
 * genuine paying customer. Repeat calls during development polluted the
 * Meta Events Manager Purchase counter to "11" while actual paying customers
 * in Stripe was 2 (https://github.com/neverpeakev/momfluence). We require
 * testEventCode to prevent this from happening again.
 *
 * HOW TO GET A testEventCode:
 * Meta Events Manager → your Pixel (1468831514190648) → Test Events tab →
 * "Test browser events" section → copy the TEST<n> code shown at the top.
 * Codes look like "TEST12345". Each is project-specific.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fireServerSidePurchase } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_EMAIL = "kelly.curphey@gmail.com";

export async function POST(req: NextRequest) {
  // Admin auth — same pattern as /api/optimizer/launch.
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: me } = await sb
    .from("momfluencers")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) {
    return NextResponse.json({ error: "admin only" }, { status: 403 });
  }

  // Parse body — all fields optional EXCEPT testEventCode (or the explicit
  // confirmProductionPollution opt-out).
  let body: {
    email?: string;
    sessionId?: string;
    valueUsd?: number;
    testEventCode?: string;
    confirmProductionPollution?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine; we'll use defaults below.
  }

  const email = (body.email || DEFAULT_EMAIL).trim().toLowerCase();
  const sessionId = body.sessionId || `test_capi_${Date.now()}`;
  const valueUsd = Number.isFinite(body.valueUsd) ? Number(body.valueUsd) : 5.0;
  const testEventCode = body.testEventCode?.trim() || undefined;
  const confirmProductionPollution = body.confirmProductionPollution === true;

  // Guard: require either testEventCode (safe — routes to Meta Test Events
  // tab, never hits production aggregates) OR an explicit opt-out flag. See
  // the docblock at the top of this file for the why behind this guard.
  if (!testEventCode && !confirmProductionPollution) {
    return NextResponse.json(
      {
        error: "testEventCode required",
        message:
          "Provide a `testEventCode` in the body (recommended — routes events to Meta Test Events tab without polluting production stats). To bypass and fire a real Purchase event against the production Pixel, pass `confirmProductionPollution: true` explicitly.",
        howToGetTestEventCode:
          "Meta Events Manager → Pixel 1468831514190648 → Test Events tab → copy the TEST<n> code shown at the top of the 'Test browser events' section.",
      },
      { status: 400 }
    );
  }

  // Look up the momfluencer to get their real stripe_customer_id. Using the
  // real id makes external_id hash consistent with what production webhook
  // calls would produce — so the test exercises the exact same payload shape.
  const { data: mf, error: lookupErr } = await sb
    .from("momfluencers")
    .select("email, stripe_customer_id")
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json(
      { error: `lookup failed: ${lookupErr.message}` },
      { status: 500 }
    );
  }
  if (!mf || !mf.stripe_customer_id) {
    return NextResponse.json(
      { error: `no momfluencer found for ${email} (or stripe_customer_id is null)` },
      { status: 404 }
    );
  }

  // Fire the same helper the Stripe webhook fires. This is the entire reason
  // the endpoint exists — to exercise the exact production code path.
  const result = await fireServerSidePurchase({
    email: mf.email,
    stripeCustomerId: mf.stripe_customer_id,
    stripeCheckoutSessionId: sessionId,
    value: valueUsd,
    currency: "USD",
    eventTimeUnixSeconds: Math.floor(Date.now() / 1000),
    eventSourceUrl: "https://momfluence.app/welcome",
    testEventCode,
  });

  return NextResponse.json({
    ...result,
    // Echo back what we sent so the caller can verify in Meta UI.
    sent: {
      email: mf.email,
      stripeCustomerId: mf.stripe_customer_id,
      sessionId,
      valueUsd,
      testEventCode: testEventCode ?? null,
    },
    nextSteps: testEventCode
      ? `Open Meta Events Manager → Test Events tab → look for event_id=${result.eventId}`
      : `Watch Meta Events Manager → Overview → Purchase row. The aggregate counter will move within 24-48h. Vercel logs for "[meta-capi]" line are immediate.`,
  });
}
