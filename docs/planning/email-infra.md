# MomFluence email infrastructure — setup checklist

**Last reviewed:** 2026-05-18
**Owner:** Kevin
**Domain:** `momfluence.app` (DNS managed by Vercel)

This is the human-step checklist to take `hello@momfluence.app` from
"not provisioned" to "receives mail + sends transactional email + has an
inbox agent auto-acking new mail every 30 min."

The MomFluence repo is already wired for this once the env vars below
exist on Vercel — `lib/email.ts` and `/api/cron/inbox-agent/route.ts`
both gracefully no-op until credentials are present.

---

## Stack

| Concern | Service | Cost |
|---|---|---|
| Inbound — forward `hello@momfluence.app` → Kevin's Gmail | **ImprovMX** (free tier) | $0/mo |
| Outbound — send from `hello@momfluence.app` (account creation, auto-ack, transactional) | **Resend** (free tier 3K emails/mo) | $0/mo |
| Inbox agent — every 30 min, ack new mail + label | **Vercel cron** + Gmail API (OAuth refresh token) | $0/mo |

Why this combo (vs Google Workspace at $7/user/mo, or Cloudflare Email
Routing requiring nameserver migration off Vercel): zero cost, no DNS
host change, ImprovMX forwards into Kevin's existing Gmail so nothing
new to monitor day-to-day.

---

## Step 1 — Sign up for ImprovMX (~5 min)

1. Go to https://improvmx.com → **Sign up free** (use `kevin@neverpeakmarketing.com`).
2. **Add domain** → `momfluence.app`
3. ImprovMX shows two MX records to add. They look like:
   ```
   Type  Name  Value                  Priority
   MX    @     mx1.improvmx.com       10
   MX    @     mx2.improvmx.com       20
   ```
4. Add an alias: `hello` → forwards to `kevin@neverpeakmarketing.com`
5. (Optional, recommended): add aliases `kevin`, `kelly`, `support` all
   forwarding to `kevin@neverpeakmarketing.com` too so anything @momfluence.app
   lands in your existing Gmail.

---

## Step 2 — Sign up for Resend (~5 min)

1. Go to https://resend.com → **Sign up free** (same email).
2. **Domains → Add Domain** → `momfluence.app`
3. Resend shows ~3-5 DNS records to add — they look like:
   ```
   Type    Name                       Value                              TTL
   TXT     @ or send                  v=spf1 include:_spf.resend.com ~all  Auto
   TXT     resend._domainkey          [long DKIM key value]              Auto
   MX      send                       feedback-smtp.us-east-1.amazonses.com (priority 10)  Auto
   ```
   (The exact records vary per account — copy whatever Resend shows you.)
4. Copy the API key from **API Keys → Create API Key**. Save it for Step 4.

---

## Step 3 — Add all DNS records to Vercel DNS (~10 min)

DNS for `momfluence.app` is managed in Vercel. Records go in:
**Vercel Dashboard → momfluence-platform → Settings → Domains → momfluence.app → DNS Records**

⚠️ **Critical: SPF merge.** Both ImprovMX (Step 1) and Resend (Step 2)
want their own SPF TXT record. Only ONE SPF TXT record is allowed per
domain. If both gave you an SPF line, combine them into a single TXT
record:

```
v=spf1 include:spf.improvmx.com include:_spf.resend.com ~all
```

Records to paste into Vercel DNS:

| Type  | Name | Value | Priority |
|---|---|---|---|
| MX    | @ | `mx1.improvmx.com` | 10 |
| MX    | @ | `mx2.improvmx.com` | 20 |
| TXT   | @ | `v=spf1 include:spf.improvmx.com include:_spf.resend.com ~all` | — |
| TXT   | `resend._domainkey` | [whatever Resend gave you] | — |
| MX    | `send` (if Resend asked) | `feedback-smtp.us-east-1.amazonses.com` | 10 |
| TXT   | `_dmarc` (recommended) | `v=DMARC1; p=none; rua=mailto:kevin@neverpeakmarketing.com` | — |

The existing `facebook-domain-verification=` TXT record stays — Vercel
DNS lets you have multiple TXT records on the same name. Don't delete it.

Propagation: usually < 5 min on Vercel DNS but allow up to an hour.
Verify with:
```sh
dig +short mx momfluence.app
dig +short txt momfluence.app
```

Back in Resend → Domains → momfluence.app, hit **Verify**. Should turn
green within 5-15 min after the records propagate.

---

## Step 4 — Add Vercel env vars (~3 min)

In Vercel Dashboard → momfluence-platform → Settings → Environment Variables:

| Variable | Value | Scope |
|---|---|---|
| `RESEND_API_KEY` | (from Step 2) | Production + Preview |
| `EMAIL_FROM` | `MomFluence <hello@momfluence.app>` | Production + Preview |
| `EMAIL_REPLY_TO` | `hello@momfluence.app` | Production + Preview |

After saving, **redeploy** (Deployments → latest → ... → Redeploy) so
the new env vars are picked up.

---

## Step 5 — Send a test ack (~2 min)

Once Step 4 is done and the redeploy is READY, send yourself a test:

```sh
# From any machine
curl -X POST https://momfluence.app/api/admin/test-email \
  -H "x-admin-key: $INBOX_AGENT_ADMIN_KEY" \
  -d '{"to":"kevin@neverpeakmarketing.com"}'
```

(This admin endpoint isn't built yet — follow-up PR. Easier check:
sign up a test account on `/signup` and confirm the account-creation
email arrives from `hello@momfluence.app`.)

---

## Step 6 — Inbox agent OAuth (Gmail API refresh token)

This is the only step with real friction — Gmail API requires Kevin to
do a one-time OAuth handshake to mint a refresh token that the cron
uses to read the inbox without him being logged in.

1. Go to https://console.cloud.google.com → Create new project
   "MomFluence Inbox Agent" (or use any existing project).
2. **APIs & Services → Enable APIs → Gmail API → Enable**.
3. **OAuth consent screen** → External → fill in app name "MomFluence Inbox Agent",
   user support email = kevin@..., add Gmail readonly + send scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify   (for labels)
   ```
   Add kevin@neverpeakmarketing.com as a test user.
4. **Credentials → Create Credentials → OAuth client ID → Web application**.
   Authorized redirect URI: `https://developers.google.com/oauthplayground`
   (we'll use the OAuth playground to mint the refresh token)
5. Copy **Client ID** + **Client Secret**. Save for env vars.
6. Go to https://developers.google.com/oauthplayground/
   - Gear icon top-right → check "Use your own OAuth credentials" → paste
     client ID + secret
   - Step 1: paste the three scopes above → Authorize APIs → log in as
     kevin@neverpeakmarketing.com → Allow
   - Step 2: Exchange authorization code for tokens → copy the
     **Refresh token** (long string starting with `1//`)
7. Add to Vercel env:
   ```
   GMAIL_OAUTH_CLIENT_ID=...apps.googleusercontent.com
   GMAIL_OAUTH_CLIENT_SECRET=GOCSPX-...
   GMAIL_REFRESH_TOKEN=1//...
   ```
8. Redeploy.

The cron at `/api/cron/inbox-agent` will detect all three env vars
present and switch from `no_op_pending_env` → actual processing on the
next tick. Verify with Vercel runtime logs (filter by path
`/api/cron/inbox-agent`, look for "tick reached active branch").

---

## Step 7 — Migrate Supabase auth emails to Resend SMTP (~10 min)

So account-creation emails come from `hello@momfluence.app` instead of
`noreply@mail.supabase.io`.

1. Supabase Dashboard → momfluence project → **Authentication → Email Templates**
2. **SMTP Settings** → enable Custom SMTP
3. Resend SMTP credentials (from Resend dashboard → SMTP):
   ```
   Host:     smtp.resend.com
   Port:     465 (SSL) or 587 (TLS)
   Username: resend
   Password: [your RESEND_API_KEY]
   Sender:   hello@momfluence.app
   Sender name: MomFluence
   ```
4. Send test → should land in inbox from `hello@momfluence.app`.

---

## What's wired in the repo today

- `lib/email.ts` — Resend wrapper, `sendEmail()` + `sendInboundAck()`. No-ops gracefully when `RESEND_API_KEY` is unset.
- `app/api/cron/inbox-agent/route.ts` — every-30-min cron, no-ops until all four GMAIL_* + RESEND_API_KEY envs are set.
- `vercel.json` — cron schedule entry.
- `.env.example` — all new env vars documented.

Once you complete Steps 1-6 above, the inbox agent is fully autonomous.
Step 7 is independent and can be done anytime.

---

## What's NOT yet built (follow-up PR after Step 6)

- The actual Gmail polling logic inside `/api/cron/inbox-agent`. It currently logs `"reached active branch — Gmail polling not yet implemented"`. The follow-up PR installs `googleapis` npm, reads new threads matching `deliveredto:hello@momfluence.app -label:momfluence-acked`, calls `sendInboundAck` from `lib/email.ts`, applies the label to dedupe.
- An admin "force-tick" route + dashboard for visibility.
- Classification quality — first version uses simple keyword matching (refund/cancel/bug/how-to). Can upgrade to an LLM classifier later.

Status check: when this doc is updated to say "all steps complete + agent processing successfully," the email infra is fully live.
