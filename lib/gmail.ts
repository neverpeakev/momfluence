/**
 * Gmail API client for the inbox-agent cron.
 *
 * One responsibility: turn the three GMAIL_OAUTH_* env vars into a
 * gmail_v1.Gmail instance, plus a few thin helpers we use from the cron.
 * Anything more complex (classification, ack send) lives in the route.
 *
 * The OAuth credentials were minted in docs/planning/email-infra.md Step 6
 * via the OAuth Playground — see that doc for the human steps.
 */

import { google, gmail_v1 } from "googleapis";

const ACKED_LABEL_NAME = "MomFluence/Acked";

/** Build a Gmail API client using the long-lived refresh token. */
export function gmailClient(): gmail_v1.Gmail | null {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth });
}

/**
 * Fetch or lazy-create the "MomFluence/Acked" label. Used to mark threads
 * we've already auto-acked so the cron never double-acks the same thread.
 */
export async function getOrCreateAckedLabel(
  gmail: gmail_v1.Gmail
): Promise<string> {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existing = data.labels?.find((l) => l.name === ACKED_LABEL_NAME);
  if (existing?.id) return existing.id;

  const { data: created } = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: ACKED_LABEL_NAME,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });
  if (!created.id) throw new Error("Failed to create MomFluence/Acked label");
  return created.id;
}

export interface ParsedThread {
  threadId: string;
  messageId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
}

/**
 * List threads sent to hello@momfluence.app (or other @momfluence.app aliases)
 * that have NOT yet been auto-acked.
 *
 * Caps at 20 threads/tick to keep the cron safely under the 60s budget.
 * If the inbox ever burns past that, the next tick (30 min later) picks up
 * the remaining items — no message is dropped.
 */
export async function fetchUnackedInboundThreads(
  gmail: gmail_v1.Gmail,
  ackedLabelName: string,
  maxResults = 20
): Promise<ParsedThread[]> {
  // We query by Gmail's `deliveredto` operator, which matches the original
  // To header even after ImprovMX rewrites the forwarded envelope.
  // The negative label filter prevents re-acking anything we've already
  // touched.
  const query = `deliveredto:@momfluence.app newer_than:7d -label:${ackedLabelName.replace(
    "/",
    "-"
  )}`;
  const { data: list } = await gmail.users.threads.list({
    userId: "me",
    q: query,
    maxResults,
  });
  if (!list.threads || list.threads.length === 0) return [];

  // Fetch each thread's first message to get headers + snippet.
  const parsed: ParsedThread[] = [];
  for (const t of list.threads) {
    if (!t.id) continue;
    try {
      const { data: thread } = await gmail.users.threads.get({
        userId: "me",
        id: t.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "To", "Delivered-To"],
      });
      const firstMsg = thread.messages?.[0];
      if (!firstMsg) continue;
      const headers = firstMsg.payload?.headers ?? [];
      const fromRaw = headers.find((h) => h.name === "From")?.value ?? "";
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
      const { name, email } = parseFromHeader(fromRaw);
      parsed.push({
        threadId: t.id,
        messageId: firstMsg.id ?? "",
        fromEmail: email,
        fromName: name,
        subject,
        snippet: thread.snippet ?? firstMsg.snippet ?? "",
      });
    } catch {
      // Skip threads we can't read; surface in the cron's overall log if
      // every thread fails, but don't fail the tick on a single bad one.
      continue;
    }
  }
  return parsed;
}

/** Apply the Acked label to the thread so we never double-ack. */
export async function markThreadAcked(
  gmail: gmail_v1.Gmail,
  threadId: string,
  ackedLabelId: string
): Promise<void> {
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: { addLabelIds: [ackedLabelId] },
  });
}

/**
 * Cheap keyword-based classifier. Fine as a v1; can swap in an LLM later
 * if the auto-ack copy needs to get smarter.
 */
export function classifyInbound(
  subject: string,
  snippet: string
): "refund" | "cancel" | "how-to" | "bug" | "other" {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (/\b(refund|charge ?back|chargeback|reimburse|money back)\b/.test(text)) {
    return "refund";
  }
  if (/\b(cancel|unsubscribe|stop billing|delete (my )?account|close (my )?account)\b/.test(text)) {
    return "cancel";
  }
  if (/\b(error|bug|broken|not working|doesn'?t work|crashed?|stuck|can'?t)\b/.test(text)) {
    return "bug";
  }
  if (/\b(how (do|to)|where (do|is)|what (do|is)|tutorial|help me|setup|set up)\b/.test(text)) {
    return "how-to";
  }
  return "other";
}

/** "Kevin Neal <kevin@…>" → {name: "Kevin Neal", email: "kevin@…"} */
function parseFromHeader(raw: string): { name: string; email: string } {
  const m = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (m) {
    return { name: m[1].replace(/^"|"$/g, "").trim(), email: m[2].trim() };
  }
  // Bare-email fallback.
  return { name: "", email: raw.trim() };
}
