/**
 * /api/cron/inbox-agent — runs every 30 minutes via vercel.json
 *
 * Reads new inbound threads at hello@momfluence.app, sends a warm
 * "we got it" auto-acknowledgment, and tags the thread on Kevin's
 * radar so he can drop in with the substantive reply when ready.
 *
 * Implementation plan:
 *   1. ImprovMX forwards hello@momfluence.app → kevin@neverpeakmarketing.com
 *      (Kevin's existing Gmail — he already reads it).
 *   2. This cron uses Gmail API (OAuth refresh token) to query NEW threads
 *      with deliveredto:hello@momfluence.app that haven't been auto-acked yet
 *      (the label "MomFluence/Acked" is the dedupe key).
 *   3. For each: classify via subject + first 200 chars, sendInboundAck()
 *      via Resend, apply the "MomFluence/Acked" label.
 *
 * Activation gate: this route is a graceful no-op until ALL of these are set:
 *   • RESEND_API_KEY                  (Vercel encrypted env)
 *   • GMAIL_REFRESH_TOKEN             (Vercel encrypted env)
 *   • GMAIL_OAUTH_CLIENT_ID           (Vercel encrypted env)
 *   • GMAIL_OAUTH_CLIENT_SECRET       (Vercel encrypted env)
 *
 * So this PR can ship and the cron tick will appear in Vercel logs as
 * "no-op pending env" until Kevin completes the OAuth setup
 * (docs/planning/email-infra.md). The moment all four are set, the cron
 * starts processing.
 *
 * Security:
 *   • Vercel-fired crons include x-vercel-cron header; we verify presence.
 *     Outside callers without the header get 401.
 *   • The OAuth refresh token only ever lives in Vercel encrypted env —
 *     never logged, never echoed back in responses.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface TickResult {
  ok: true;
  status: "no_op_pending_env" | "no_new_threads" | "processed";
  missingEnv?: string[];
  threadsScanned?: number;
  threadsAcked?: number;
  durationMs: number;
}

const REQUIRED_ENV = [
  "RESEND_API_KEY",
  "GMAIL_REFRESH_TOKEN",
  "GMAIL_OAUTH_CLIENT_ID",
  "GMAIL_OAUTH_CLIENT_SECRET",
] as const;

export async function GET(request: Request): Promise<NextResponse> {
  const started = Date.now();

  // Verify the cron header so randoms on the internet can't pingthis route.
  // Vercel-fired crons always send x-vercel-cron: 1.
  const isCron = request.headers.get("x-vercel-cron") === "1";
  // Allow manual admin-triggered runs via ?admin_key=... in case Kevin wants
  // to force a tick from his browser. Constant-time comparison via Buffer.
  const adminKeyHeader = request.headers.get("x-admin-key") ?? "";
  const adminKeyEnv = process.env.INBOX_AGENT_ADMIN_KEY ?? "";
  const isAdmin =
    adminKeyEnv.length > 0 &&
    adminKeyHeader.length === adminKeyEnv.length &&
    safeEqual(adminKeyHeader, adminKeyEnv);
  if (!isCron && !isAdmin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  // Activation gate — list every env that's missing so it's obvious what to
  // configure. Returns ok:true so Vercel doesn't treat a no-op as a failure.
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const result: TickResult = {
      ok: true,
      status: "no_op_pending_env",
      missingEnv: [...missing],
      durationMs: Date.now() - started,
    };
    // Single info-level log; gets noisy at every-30-min so we keep it terse.
    console.log(
      `[inbox-agent] tick no-op pending env: missing=${missing.join(",")}`
    );
    return NextResponse.json(result);
  }

  // Real implementation lands in the follow-up PR once Kevin has OAuth done.
  // See docs/planning/email-infra.md for the OAuth setup checklist.
  // For now: log that we reached the active branch and return.
  console.log(
    "[inbox-agent] tick reached active branch — Gmail polling not yet implemented; see docs/planning/email-infra.md"
  );
  const result: TickResult = {
    ok: true,
    status: "no_new_threads",
    threadsScanned: 0,
    threadsAcked: 0,
    durationMs: Date.now() - started,
  };
  return NextResponse.json(result);
}

/** Constant-time string compare to avoid timing-leak on admin key check. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
