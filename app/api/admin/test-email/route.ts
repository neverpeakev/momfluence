/**
 * /api/admin/test-email — diagnostic for the Resend pipeline.
 *
 * Fires sendEmail() and/or sendInboundAck() from lib/email.ts with real
 * args, bypassing the cron / signup flow entirely. Useful for:
 *   - Verifying RESEND_API_KEY + DKIM/SPF/DMARC propagated correctly
 *     after Step 1-4 of docs/planning/email-infra.md
 *   - Surfacing exact Resend API errors when deliverability fails
 *   - Smoke-checking that hello@momfluence.app actually sends + receives
 *     end-to-end (combine with ImprovMX forwarding to kevin@neverpeak…)
 *
 * Auth: x-admin-key header must match INBOX_AGENT_ADMIN_KEY env var (set
 * the same one used by /api/cron/inbox-agent). Constant-time compare.
 *
 * Request body (all optional):
 *   {
 *     to?:        string   // default "kevin@neverpeakmarketing.com"
 *     mode?:      "plain" | "ack"   // default "ack"
 *     subject?:   string   // for plain mode; ignored in ack mode
 *     senderName?: string  // for ack mode personalization
 *     category?:  "refund" | "cancel" | "how-to" | "bug" | "other"
 *   }
 *
 * Response: { ok, mode, to, messageId?, skippedReason?, error? }
 *
 * The 200 + ok:false case is reserved for "no-op — env vars missing"; an
 * actual Resend API failure returns 200 + ok:false + error message so the
 * caller can see the deliverability error without it tripping monitoring.
 */

import { NextResponse, type NextRequest } from "next/server";
import { sendEmail, sendInboundAck } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Body {
  to?: string;
  mode?: "plain" | "ack";
  subject?: string;
  senderName?: string;
  category?: "refund" | "cancel" | "how-to" | "bug" | "other";
}

const DEFAULT_TO = "kevin@neverpeakmarketing.com";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const adminKeyHeader = req.headers.get("x-admin-key") ?? "";
  const adminKeyEnv = process.env.INBOX_AGENT_ADMIN_KEY ?? "";
  if (
    adminKeyEnv.length === 0 ||
    adminKeyHeader.length !== adminKeyEnv.length ||
    !safeEqual(adminKeyHeader, adminKeyEnv)
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const to = body.to ?? DEFAULT_TO;
  const mode = body.mode ?? "ack";

  if (mode === "plain") {
    const result = await sendEmail({
      to,
      subject: body.subject ?? "MomFluence test email",
      text: [
        "This is a test from /api/admin/test-email (mode=plain).",
        "",
        "If you're reading this, the Resend pipeline works:",
        "  • RESEND_API_KEY is configured",
        "  • momfluence.app is verified for sending",
        "  • DKIM + SPF auth correctly",
        "",
        "Diagnostic only. No action needed.",
        "",
        "— MomFluence",
      ].join("\n"),
      tag: "admin-test-plain",
    });
    return NextResponse.json({ ...result, mode, to });
  }

  // ack mode — exercises the same code path the inbox agent uses for
  // auto-replies, so any deliverability issue here will reproduce for real
  // user emails.
  const result = await sendInboundAck({
    to,
    inboundSubject: body.subject ?? "Test: how do I cancel?",
    senderName: body.senderName,
    category: body.category ?? "cancel",
    // Random threadId so idempotency doesn't dedupe repeated tests.
    threadId: `admin-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });
  return NextResponse.json({ ...result, mode, to });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
