/**
 * /api/cron/inbox-agent — runs every 30 minutes via vercel.json
 *
 * What it does each tick:
 *   1. Authenticates via x-vercel-cron header (or x-admin-key for manual runs)
 *   2. Verifies all 4 required env vars are set (no-ops gracefully if not)
 *   3. Queries Gmail for new threads delivered to *@momfluence.app
 *      that don't already carry the "MomFluence/Acked" label
 *   4. For each new thread: classify (refund/cancel/bug/how-to/other),
 *      send a warm auto-ack via Resend from hello@momfluence.app,
 *      apply the "MomFluence/Acked" label so we never double-ack
 *   5. Returns the count of threads scanned/acked + duration
 *
 * Inbound path: ImprovMX forwards *@momfluence.app → kevin@neverpeakmarketing.com,
 * so the threads land in Kevin's existing Gmail. The OAuth refresh token is
 * scoped to gmail.modify on that exact account.
 *
 * Setup checklist: docs/planning/email-infra.md (Steps 1-6 complete on
 * 2026-05-18). The 4 required env vars on Vercel:
 *   • RESEND_API_KEY
 *   • GMAIL_OAUTH_CLIENT_ID
 *   • GMAIL_OAUTH_CLIENT_SECRET
 *   • GMAIL_REFRESH_TOKEN
 *
 * Security:
 *   • OAuth credentials only ever live in Vercel encrypted env (never logged)
 *   • One per-thread idempotency key on the Resend ack means even a
 *     double-fire of the cron can't double-send to the user
 *   • 20-thread cap per tick keeps duration safely under maxDuration=60s
 */

import { NextResponse } from "next/server";
import { sendInboundAck } from "@/lib/email";
import {
  classifyInbound,
  fetchUnackedInboundThreads,
  getOrCreateAckedLabel,
  gmailClient,
  markThreadAcked,
} from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

interface AckSummary {
  threadId: string;
  to: string;
  category: string;
  ok: boolean;
  error?: string;
}

interface TickResult {
  ok: true;
  status: "no_op_pending_env" | "no_new_threads" | "processed";
  missingEnv?: string[];
  threadsScanned?: number;
  threadsAcked?: number;
  acks?: AckSummary[];
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

  // Verify the cron header so randoms on the internet can't ping this route.
  // Vercel-fired crons always send x-vercel-cron: 1.
  const isCron = request.headers.get("x-vercel-cron") === "1";
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

  // Activation gate.
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const result: TickResult = {
      ok: true,
      status: "no_op_pending_env",
      missingEnv: [...missing],
      durationMs: Date.now() - started,
    };
    console.log(
      `[inbox-agent] tick no-op pending env: missing=${missing.join(",")}`
    );
    return NextResponse.json(result);
  }

  // Build Gmail client and read the inbox.
  const gmail = gmailClient();
  if (!gmail) {
    // Shouldn't reach here given the env check above, but defensive.
    return NextResponse.json({
      ok: true,
      status: "no_op_pending_env",
      missingEnv: REQUIRED_ENV.filter((k) => !process.env[k]),
      durationMs: Date.now() - started,
    } satisfies TickResult);
  }

  let ackedLabelId: string;
  try {
    ackedLabelId = await getOrCreateAckedLabel(gmail);
  } catch (err) {
    console.error(
      `[inbox-agent] failed to get/create Acked label: ${stringifyError(err)}`
    );
    return NextResponse.json(
      { ok: false, error: "label_init_failed" },
      { status: 500 }
    );
  }

  const threads = await fetchUnackedInboundThreads(gmail, "MomFluence/Acked");
  if (threads.length === 0) {
    console.log("[inbox-agent] tick: no new threads");
    return NextResponse.json({
      ok: true,
      status: "no_new_threads",
      threadsScanned: 0,
      threadsAcked: 0,
      durationMs: Date.now() - started,
    } satisfies TickResult);
  }

  const acks: AckSummary[] = [];
  for (const t of threads) {
    // Skip threads where the sender domain is ours (forwarded loop guard).
    if (/@momfluence\.app$/i.test(t.fromEmail)) {
      // Still mark acked so we don't keep re-evaluating it.
      try {
        await markThreadAcked(gmail, t.threadId, ackedLabelId);
      } catch {}
      acks.push({
        threadId: t.threadId,
        to: t.fromEmail,
        category: "self-loop-skipped",
        ok: true,
      });
      continue;
    }

    const category = classifyInbound(t.subject, t.snippet);
    const firstName = t.fromName.split(/\s+/)[0] || undefined;

    const ack = await sendInboundAck({
      to: t.fromEmail,
      inboundSubject: t.subject,
      senderName: firstName,
      category,
      threadId: t.threadId,
    });

    if (ack.ok) {
      // Only label as Acked when the send succeeded. If Resend errored,
      // leave the thread un-labelled so the next tick retries.
      try {
        await markThreadAcked(gmail, t.threadId, ackedLabelId);
      } catch (err) {
        console.error(
          `[inbox-agent] sent ack but failed to label thread ${t.threadId}: ${stringifyError(err)}`
        );
      }
    }

    acks.push({
      threadId: t.threadId,
      to: t.fromEmail,
      category,
      ok: ack.ok,
      error: ack.error ?? ack.skippedReason,
    });
  }

  const acked = acks.filter((a) => a.ok).length;
  console.log(
    `[inbox-agent] tick processed scanned=${threads.length} acked=${acked} duration_ms=${Date.now() - started}`
  );

  return NextResponse.json({
    ok: true,
    status: "processed",
    threadsScanned: threads.length,
    threadsAcked: acked,
    acks,
    durationMs: Date.now() - started,
  } satisfies TickResult);
}

function stringifyError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
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
