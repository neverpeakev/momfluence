/**
 * Diagnostic endpoint for the server-side Meta CAPI CompleteRegistration path.
 *
 * Sibling of /api/admin/test-capi-purchase. The CAPI helper at
 * lib/meta-capi.ts fireServerSideCompleteRegistration() is normally fired
 * from /api/checkout/create when a real auth user hits checkout — this
 * endpoint lets an admin invoke it directly with any test user so we can
 * verify the plumbing works in Meta Events Manager without an actual signup.
 *
 * Surface evidence:
 *   - Vercel runtime logs: "[meta-capi] CompleteRegistration event sent (event_id=...)"
 *   - JSON response: { ok, eventId, metaStatus, metaBody }
 *   - Meta Events Manager: Test Events tab (if testEventCode passed) OR
 *                          Overview CompleteRegistration row (24-48h lag)
 *
 * Auth: admin only (cookie + is_admin), OR Bearer CRON_SECRET for CI/agent use.
 *
 * Body:
 *   {
 *     authUserId?:                string   // default: a random uuid
 *     email?:                     string   // default "kelly.curphey@gmail.com"
 *     testEventCode?:             string   // REQUIRED unless confirmProductionPollution=true
 *     confirmProductionPollution?: true    // explicit opt-out — fires real event
 *   }
 *
 * Same testEventCode requirement as the Purchase variant — see that file's
 * docblock for the WHY (we previously polluted prod CR counters during dev).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fireServerSideCompleteRegistration } from "@/lib/meta-capi";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_EMAIL = "kelly.curphey@gmail.com";

function bearerFrom(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function POST(req: NextRequest) {
  // Admin OR Bearer CRON_SECRET auth — same pattern as our other funnel-lab routes.
  let authVia: "cookie" | "cron-secret" | null = null;

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const { data: me } = await sb
      .from("momfluencers")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (me?.is_admin) authVia = "cookie";
  }
  if (!authVia) {
    const t = bearerFrom(req);
    if (t && process.env.CRON_SECRET && t === process.env.CRON_SECRET) {
      authVia = "cron-secret";
    }
  }
  if (!authVia) {
    return NextResponse.json({ error: "unauthorized (admin cookie or CRON_SECRET bearer required)" }, { status: 401 });
  }

  let body: {
    authUserId?: string;
    email?: string;
    testEventCode?: string;
    confirmProductionPollution?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    // empty body fine
  }

  const authUserId = body.authUserId || `test_${randomUUID()}`;
  const email = (body.email || DEFAULT_EMAIL).trim().toLowerCase();
  const testEventCode = body.testEventCode?.trim() || undefined;
  const confirmProductionPollution = body.confirmProductionPollution === true;

  if (!testEventCode && !confirmProductionPollution) {
    return NextResponse.json(
      {
        error: "testEventCode required",
        message:
          "Provide a `testEventCode` in the body to route this event to Meta Test Events (no impact on prod aggregates). To fire a real CompleteRegistration event against the production Pixel, pass `confirmProductionPollution: true`.",
        howToGetTestEventCode:
          "Meta Events Manager → Pixel 1468831514190648 → Test Events tab → copy the TEST<n> code at the top of 'Test browser events'.",
      },
      { status: 400 }
    );
  }

  // Fire the exact same helper that /api/checkout/create fires in production.
  const result = await fireServerSideCompleteRegistration({
    authUserId,
    email,
    eventSourceUrl: "https://momfluence.app/signup",
    eventTimeUnixSeconds: Math.floor(Date.now() / 1000),
    clientIpAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
    clientUserAgent: req.headers.get("user-agent") || undefined,
    testEventCode,
  });

  return NextResponse.json({
    ...result,
    via: authVia,
    sent: {
      authUserId,
      email,
      testEventCode: testEventCode ?? null,
      confirmProductionPollution,
    },
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/admin/test-capi-complete-registration",
    method: "POST",
    auth: "admin cookie OR Bearer CRON_SECRET",
    body_schema: {
      authUserId: "string (optional, default random uuid)",
      email: "string (optional, default kelly.curphey@gmail.com)",
      testEventCode: "string (required unless confirmProductionPollution=true)",
      confirmProductionPollution: "true (only set if you actually want to hit prod stats)",
    },
  });
}
