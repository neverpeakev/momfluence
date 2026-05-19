/**
 * Resend wrapper for transactional + acknowledgment email.
 *
 * Setup status (as of 2026-05-18):
 *   • Inbound:  ImprovMX → forwards hello@momfluence.app → kevin@neverpeakmarketing.com
 *               (Kevin signs up at improvmx.com, adds 3 DNS records to Vercel DNS)
 *   • Outbound: Resend → sends FROM hello@momfluence.app
 *               (Kevin signs up at resend.com, verifies the domain, adds DKIM CNAMEs)
 *   • Env:      RESEND_API_KEY (Vercel encrypted env, both Production + Preview)
 *               EMAIL_FROM      (defaults to "MomFluence <hello@momfluence.app>")
 *               EMAIL_REPLY_TO  (defaults to hello@momfluence.app)
 *
 * Until RESEND_API_KEY is set, every send() call is a no-op that logs a
 * "skipped — RESEND_API_KEY missing" warning. This lets the cron and any
 * future signup hooks deploy without crashing during the DNS+verification
 * window.
 *
 * Build philosophy: this is the ONLY place we instantiate the Resend SDK.
 * Routes call sendEmail() / sendInboundAck() — they never import Resend
 * directly. Makes provider swap (Postmark, Loops, etc.) a 5-minute change.
 */

import { Resend } from "resend";

const FROM_DEFAULT = "MomFluence <hello@momfluence.app>";
const REPLY_TO_DEFAULT = "hello@momfluence.app";

interface SendArgs {
  to: string | string[];
  subject: string;
  /** Plain-text alternative. Strongly recommended for deliverability. */
  text: string;
  /** Optional HTML body. */
  html?: string;
  /** Override the default from address. */
  from?: string;
  /** Override the default reply-to address. */
  replyTo?: string;
  /** Tag for Resend analytics (e.g. "inbox-ack", "signup-welcome"). */
  tag?: string;
  /** Provided by callers that want to dedupe / track (e.g. by gmail thread id). */
  idempotencyKey?: string;
}

export interface SendResult {
  ok: boolean;
  /** Resend message id when ok, otherwise undefined. */
  messageId?: string;
  /** Reason the send was skipped or failed. */
  skippedReason?: string;
  error?: string;
}

let cached: Resend | null = null;
function client(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

/**
 * Send a generic transactional or ack email via Resend.
 *
 * Returns { ok: false, skippedReason } when RESEND_API_KEY is missing —
 * callers should NOT treat this as an error; the email infra simply isn't
 * provisioned yet.
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const resend = client();
  if (!resend) {
    // Log so it's visible in Vercel runtime logs but not as an error level.
    // Once Kevin sets RESEND_API_KEY this path stops firing.
    console.warn(
      `[email] sendEmail skipped — RESEND_API_KEY missing. to=${args.to} subject="${args.subject}"`
    );
    return { ok: false, skippedReason: "RESEND_API_KEY missing" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: args.from ?? process.env.EMAIL_FROM ?? FROM_DEFAULT,
      to: args.to,
      subject: args.subject,
      text: args.text,
      ...(args.html ? { html: args.html } : {}),
      replyTo: args.replyTo ?? process.env.EMAIL_REPLY_TO ?? REPLY_TO_DEFAULT,
      ...(args.tag ? { tags: [{ name: "category", value: args.tag }] } : {}),
      ...(args.idempotencyKey ? { headers: { "X-Idempotency-Key": args.idempotencyKey } } : {}),
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, messageId: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Reply to an inbound user email with a warm "we got it" ack. Keeps the
 * platform "real human, on it" feel without committing to a specific
 * action — the substantive reply comes from Kevin via the drafted reply.
 *
 * Subject is auto-prefixed with "Re:" if the inbound subject doesn't
 * already start with it. Plain-text only by design — looks more personal.
 */
export async function sendInboundAck(args: {
  to: string;
  inboundSubject: string;
  /** First name parsed from the sender, if available — for the greeting. */
  senderName?: string;
  /** Optional category hint surfaced in the ack copy. */
  category?: "refund" | "cancel" | "how-to" | "bug" | "other";
  /** Gmail thread id — used as idempotency key so we never double-ack. */
  threadId: string;
}): Promise<SendResult> {
  const greeting = args.senderName ? `Hi ${args.senderName},` : "Hi,";
  const reSubject = args.inboundSubject.toLowerCase().startsWith("re:")
    ? args.inboundSubject
    : `Re: ${args.inboundSubject}`;

  // Category-specific hint kept short — the ack is intentionally a holding
  // reply, not a substantive answer.
  const hint = (() => {
    switch (args.category) {
      case "refund":
        return "If this is about a refund or payment issue, I'm prioritizing it personally — give me up to one business day and I'll have a clear answer for you.";
      case "cancel":
        return "If you're looking to cancel, you can self-serve from your account at https://app.momfluence.app/profile (Manage subscription). If anything's blocking you, I'll personally help — same-day.";
      case "bug":
        return "Sounds like a bug — I'll look into it shortly and reply with what I find. If you can include the URL or a screenshot, that speeds things up.";
      case "how-to":
        return "Most how-to questions are answered in our FAQ — https://momfluence.app/#faq — and the dashboard at app.momfluence.app. If you've already checked and still stuck, I'll reply personally.";
      default:
        return "I'll reply personally as soon as I can — usually within a few hours during business hours.";
    }
  })();

  const text = [
    greeting,
    "",
    "Got your message — this is a quick note to let you know it landed and I'm on it.",
    "",
    hint,
    "",
    "If you need to share anything else in the meantime, just reply to this email — it threads straight back to me.",
    "",
    "— Kevin",
    "Founder, MomFluence",
    "hello@momfluence.app",
  ].join("\n");

  return sendEmail({
    to: args.to,
    subject: reSubject,
    text,
    tag: "inbox-ack",
    idempotencyKey: `ack-${args.threadId}`,
  });
}
