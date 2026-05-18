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
 * Body (all optional):
 *   {
 *     email?:        string   // default "kelly.curphey@gmail.com"
 *     sessionId?:    string   // default "test_capi_<unix_ms>"
 *     valueUsd?:     number   // default 5.0 (matches /welcome browser pixel)
 *     testEventCode?: string  // if set, Meta routes to Test Events (no
 *                              // impact on production aggregates / ad algo)
 *   }
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

  // Parse body — all fields optional.
  let body: {
    email?: string;
    sessionId?: string;
    valueUsd?: number;
    testEventCode?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine; we'll use defaults.
  }

  const email = (body.email || DEFAULT_EMAIL).trim().toLowerCase();
  const sessionId = body.sessionId || `test_capi_${Date.now()}`;
  const valueUsd = Number.isFinite(body.valueUsd) ? Number(body.valueUsd) : 5.0;
  const testEventCode = body.testEventCode?.trim() || undefined;

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
