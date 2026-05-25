/**
 * Diagnostic endpoint: read-only Stripe health + checkout-session inspection.
 *
 * Built 2026-05-25 to answer a single question that the Vercel runtime log
 * retention window can't:
 *
 *   "We have 7 net-new signups in the last 7 days, 0 of which paid. Did
 *    /api/checkout/create actually create Stripe sessions for them, did
 *    those sessions reach the Stripe page, and did the user bounce or
 *    pay or get rejected?"
 *
 * Without a Stripe MCP server, this is the cleanest way to query Stripe
 * with the production STRIPE_SECRET_KEY without exposing it locally.
 *
 * Auth: admin cookie OR Bearer CRON_SECRET — same pattern as the CAPI
 * test endpoints. READ-ONLY (no Stripe mutations).
 *
 * GET response shape:
 *   {
 *     account: { id, charges_enabled, payouts_enabled, ... },
 *     recentSessions: [ ... ],         // up to 25, newest first
 *     sessionsByClientRef: {           // optional, only if ?client_refs= passed
 *       <auth_user_id>: [ <session>, ... ]
 *     }
 *   }
 *
 * Query params:
 *   client_refs   — comma-separated auth.user IDs to look up specifically
 *   limit         — max sessions to list (default 25, max 100)
 *   since_hours   — only include sessions created since N hours ago (default 168 = 7d)
 */

import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

function bearerFrom(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

interface SessionSummary {
  id: string;
  created: number;
  created_iso: string;
  status: string | null;
  payment_status: string | null;
  client_reference_id: string | null;
  customer_email: string | null;
  customer: string | null;
  amount_total: number | null;
  currency: string | null;
  url: string | null;
  expires_at: number | null;
  mode: string;
}

function summarize(s: Stripe.Checkout.Session): SessionSummary {
  return {
    id: s.id,
    created: s.created,
    created_iso: new Date(s.created * 1000).toISOString(),
    status: s.status,
    payment_status: s.payment_status,
    client_reference_id: s.client_reference_id,
    customer_email: s.customer_email ?? s.customer_details?.email ?? null,
    customer: typeof s.customer === "string" ? s.customer : (s.customer?.id ?? null),
    amount_total: s.amount_total,
    currency: s.currency,
    url: s.url, // null after session expires
    expires_at: s.expires_at,
    mode: s.mode,
  };
}

export async function GET(req: NextRequest) {
  // Admin cookie OR Bearer CRON_SECRET auth.
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
    return NextResponse.json(
      { error: "unauthorized (admin cookie or CRON_SECRET bearer required)" },
      { status: 401 },
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not set in environment" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(secret.trim(), { maxNetworkRetries: 0, timeout: 15000 });

  const url = new URL(req.url);
  const clientRefsParam = url.searchParams.get("client_refs") || "";
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));
  const sinceHours = Math.max(1, parseInt(url.searchParams.get("since_hours") || "168", 10));
  const sinceUnix = Math.floor(Date.now() / 1000) - sinceHours * 3600;

  // 1. Stripe account health.
  let account: Record<string, unknown> = {};
  try {
    // Pass no argument to retrieve the account belonging to the API key.
    // (The Stripe TS types want >=1 args; passing the account id explicitly
    // works without elevated permissions when using a platform secret key,
    // and is fine for our standard secret key too.)
    const a = (await (stripe.accounts.retrieve as unknown as (() => Promise<Stripe.Account>))());
    account = {
      id: a.id,
      country: a.country,
      email: a.email,
      type: a.type,
      charges_enabled: a.charges_enabled,
      payouts_enabled: a.payouts_enabled,
      details_submitted: a.details_submitted,
      capabilities: a.capabilities,
      requirements: {
        currently_due: a.requirements?.currently_due ?? [],
        past_due: a.requirements?.past_due ?? [],
        eventually_due: a.requirements?.eventually_due ?? [],
        disabled_reason: a.requirements?.disabled_reason ?? null,
      },
      business_profile_url: a.business_profile?.url ?? null,
    };
  } catch (err) {
    const e = err as { message?: string; code?: string; type?: string };
    account = {
      error: e.message || "account retrieve failed",
      code: e.code,
      type: e.type,
    };
  }

  // 2. Recent checkout sessions (most recent first).
  let recentSessions: SessionSummary[] = [];
  let recentError: string | undefined;
  try {
    const list = await stripe.checkout.sessions.list({
      limit,
      created: { gte: sinceUnix },
    });
    recentSessions = list.data.map(summarize);
  } catch (err) {
    recentError = err instanceof Error ? err.message : String(err);
  }

  // 3. Filter by client_reference_id if provided.
  const clientRefs = clientRefsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sessionsByClientRef: Record<string, SessionSummary[]> = {};
  if (clientRefs.length > 0) {
    // Stripe doesn't expose a server-side filter on client_reference_id, so we
    // page through recent sessions and filter client-side. Cap to 200 sessions
    // (8 API pages of 25) — enough to cover several weeks of low-volume traffic.
    try {
      const pageSize = 100;
      let starting_after: string | undefined;
      let scanned = 0;
      const allMatching: SessionSummary[] = [];
      const wanted = new Set(clientRefs);
      while (scanned < 200) {
        const page = await stripe.checkout.sessions.list({
          limit: pageSize,
          ...(starting_after ? { starting_after } : {}),
          created: { gte: sinceUnix },
        });
        for (const s of page.data) {
          scanned++;
          if (s.client_reference_id && wanted.has(s.client_reference_id)) {
            allMatching.push(summarize(s));
          }
        }
        if (!page.has_more || page.data.length === 0) break;
        starting_after = page.data[page.data.length - 1].id;
      }
      for (const ref of clientRefs) {
        sessionsByClientRef[ref] = allMatching.filter((s) => s.client_reference_id === ref);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      for (const ref of clientRefs) {
        sessionsByClientRef[ref] = [];
      }
      return NextResponse.json(
        {
          via: authVia,
          account,
          recentSessions,
          recentError,
          sessionsByClientRef,
          clientRefFilterError: msg,
        },
        { status: 200 },
      );
    }
  }

  // 4. Optional full activity dump — answers "did anyone actually pay via Apple
  //    Pay / Link / Google Pay / PayPal and we missed it because the card-number
  //    field looks blank?" Definitive proof: list every Customer, PaymentIntent,
  //    Subscription, and successful Charge in the account over the window.
  let fullActivity: Record<string, unknown> | undefined;
  if (url.searchParams.get("full") === "true") {
    fullActivity = {};
    try {
      const customers = await stripe.customers.list({ limit: 100, created: { gte: sinceUnix } });
      fullActivity.customers = customers.data.map((c) => ({
        id: c.id,
        email: c.email,
        created: c.created,
        created_iso: new Date(c.created * 1000).toISOString(),
        name: c.name,
        balance: c.balance,
        currency: c.currency,
        default_source: c.default_source,
        invoice_prefix: c.invoice_prefix,
        livemode: c.livemode,
        deleted: c.deleted ?? false,
        metadata: c.metadata,
      }));
      fullActivity.customersCount = customers.data.length;
    } catch (err) {
      fullActivity.customersError = err instanceof Error ? err.message : String(err);
    }

    try {
      const pis = await stripe.paymentIntents.list({ limit: 100, created: { gte: sinceUnix } });
      fullActivity.paymentIntents = pis.data.map((p) => ({
        id: p.id,
        created: p.created,
        created_iso: new Date(p.created * 1000).toISOString(),
        status: p.status,
        amount: p.amount,
        amount_received: p.amount_received,
        currency: p.currency,
        customer: typeof p.customer === "string" ? p.customer : (p.customer?.id ?? null),
        payment_method: typeof p.payment_method === "string" ? p.payment_method : (p.payment_method?.id ?? null),
        payment_method_types: p.payment_method_types,
        last_payment_error: p.last_payment_error?.message ?? null,
      }));
      fullActivity.paymentIntentsCount = pis.data.length;
    } catch (err) {
      fullActivity.paymentIntentsError = err instanceof Error ? err.message : String(err);
    }

    try {
      const subs = await stripe.subscriptions.list({ limit: 100, created: { gte: sinceUnix }, status: "all" });
      fullActivity.subscriptions = subs.data.map((s) => ({
        id: s.id,
        created: s.created,
        created_iso: new Date(s.created * 1000).toISOString(),
        status: s.status,
        customer: typeof s.customer === "string" ? s.customer : s.customer.id,
        items_count: s.items?.data?.length ?? 0,
        // current_period_start/end live on subscription items in v15+ types.
        // Pull from the first item if present.
        current_period_start: s.items?.data?.[0]?.current_period_start ?? null,
        current_period_end: s.items?.data?.[0]?.current_period_end ?? null,
        canceled_at: s.canceled_at,
        cancel_at: s.cancel_at,
        livemode: s.livemode,
      }));
      fullActivity.subscriptionsCount = subs.data.length;
    } catch (err) {
      fullActivity.subscriptionsError = err instanceof Error ? err.message : String(err);
    }

    try {
      const charges = await stripe.charges.list({ limit: 100, created: { gte: sinceUnix } });
      fullActivity.charges = charges.data.map((c) => ({
        id: c.id,
        created: c.created,
        created_iso: new Date(c.created * 1000).toISOString(),
        status: c.status,
        paid: c.paid,
        amount: c.amount,
        amount_captured: c.amount_captured,
        currency: c.currency,
        customer: typeof c.customer === "string" ? c.customer : (c.customer?.id ?? null),
        payment_intent: typeof c.payment_intent === "string" ? c.payment_intent : (c.payment_intent?.id ?? null),
        payment_method_details_type: c.payment_method_details?.type ?? null,
        receipt_email: c.receipt_email,
        billing_email: c.billing_details?.email,
        refunded: c.refunded,
        disputed: c.disputed,
        failure_message: c.failure_message,
      }));
      fullActivity.chargesCount = charges.data.length;
    } catch (err) {
      fullActivity.chargesError = err instanceof Error ? err.message : String(err);
    }

    // Lookup the abandoned-signup emails by Customer.search to be EXTRA sure
    // they weren't created as Customers under a wallet auth (Link auto-creates
    // a Customer in some flows). Customer.search is eventually-consistent but
    // good enough for a one-off audit.
    const probeEmails = (url.searchParams.get("probe_emails") || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (probeEmails.length > 0) {
      try {
        const probes: Record<string, unknown> = {};
        for (const em of probeEmails) {
          const escaped = em.replace(/'/g, "\\'");
          const r = await stripe.customers.search({ query: `email:'${escaped}'`, limit: 5 });
          probes[em] = r.data.map((c) => ({
            id: c.id,
            email: c.email,
            created: c.created,
            created_iso: new Date(c.created * 1000).toISOString(),
            deleted: c.deleted ?? false,
          }));
        }
        fullActivity.customersByEmail = probes;
      } catch (err) {
        fullActivity.customersByEmailError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  return NextResponse.json({
    via: authVia,
    queryWindow: {
      sinceHours,
      sinceUnix,
      sinceIso: new Date(sinceUnix * 1000).toISOString(),
    },
    account,
    recentSessionsCount: recentSessions.length,
    recentSessions,
    recentError,
    sessionsByClientRef,
    fullActivity,
  });
}
