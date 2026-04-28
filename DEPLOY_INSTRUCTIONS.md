# Final deploy steps — 2 minutes of your time

Everything below has been done autonomously already:

- ✅ Supabase project `momfluence` (id `gndzxfrqfpszqocbsktn`, us-east-1) created and provisioned. Schema, RLS, and seed data all applied.
- ✅ Code scaffolded at `/Users/kevinneal/momfluence-platform/`.
- ✅ TypeScript clean. `npm run build` produces 11 routes.
- ✅ Pushed to `https://github.com/neverpeakev/momfluence` on branch `main` (the README-only history was replaced).

The only thing I can't do from this Claude Code session is trigger the Vercel deploy itself — your local Vercel CLI auth is expired and the Vercel MCP I have access to from here is read-only. So this last bit needs you for ~2 minutes. Pick **A** (one-time, sets up CI/CD permanently — recommended) or **B** (one-time deploy, no CI).

## A. Connect GitHub → Vercel (recommended)

This makes every `git push` to `main` auto-deploy momfluence-platform.vercel.app.

1. Go to https://vercel.com/kevin-neverpeakmars-projects/momfluence-platform/settings/git
2. Click **Connect Git Repository**, pick `neverpeakev/momfluence`, branch `main`.
3. Same project → **Settings → Environment Variables** → add the keys listed in **"Env vars to set"** below (paste each one for *Production* and *Preview*).
4. Same project → **Deployments → Redeploy** the latest, or just push a commit (e.g. `git commit --allow-empty -m "trigger deploy" && git push`).

Vercel will auto-detect Next.js (the existing project setting says "vite" but it'll re-detect from package.json).

## B. CLI one-shot

```bash
cd /Users/kevinneal/momfluence-platform
~/.npm-global/bin/vercel login            # opens browser, 30s
~/.npm-global/bin/vercel link --yes       # picks up .vercel/project.json
# add env vars (one-line each):
~/.npm-global/bin/vercel env add NEXT_PUBLIC_SUPABASE_URL production         # paste below
~/.npm-global/bin/vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
~/.npm-global/bin/vercel env add NEXT_PUBLIC_SITE_URL production
~/.npm-global/bin/vercel env add NEXT_PUBLIC_GA4_ID production
~/.npm-global/bin/vercel env add NEXT_PUBLIC_META_PIXEL production
~/.npm-global/bin/vercel env add APPS_SCRIPT_LEAD_URL production
~/.npm-global/bin/vercel env add SUPABASE_SERVICE_ROLE_KEY production
~/.npm-global/bin/vercel env add POSTBACK_SECRET production
~/.npm-global/bin/vercel deploy --prod
```

## Env vars to set

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gndzxfrqfpszqocbsktn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_DsfCQ8ATG2Qx7yGikIxqUQ_SNH8ZNxE` |
| `NEXT_PUBLIC_SITE_URL` | `https://momfluence-platform.vercel.app` (or your eventual `https://app.momfluence.app`) |
| `NEXT_PUBLIC_GA4_ID` | `G-6LJBQ1DLQ9` |
| `NEXT_PUBLIC_META_PIXEL` | `764587569626622` |
| `APPS_SCRIPT_LEAD_URL` | `https://script.google.com/macros/s/AKfycbwbRJ7wCahXVBuiL1AF2rh1gWyTl9TB-eC61VZCP1bmognjw6yWm7tbUGizxFVKAUgcIg/exec` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Get this from https://supabase.com/dashboard/project/gndzxfrqfpszqocbsktn/settings/api-keys** — it's the `service_role` secret. Required for `/t/[token]` redirects and `/api/postback`. |
| `POSTBACK_SECRET` | Any random 32-byte string. Generate with `openssl rand -hex 32`. Used to verify mock-network postbacks. |

## Make yourself an admin

After your first sign-in via magic link, run this in the Supabase SQL editor (https://supabase.com/dashboard/project/gndzxfrqfpszqocbsktn/sql) to flip the `is_admin` flag on your account:

```sql
update public.momfluencers set is_admin = true, status = 'approved'
 where email = 'kevin@neverpeakmarketing.com';
```

After that, `/admin` will show pending applicants with Approve/Reject buttons.

## Optional: extend the Apps Script to expose a list endpoint

The marketing form currently POSTs to the Apps Script and writes a row in your Sheet. To migrate those leads into the platform's `momfluencers` table, the Apps Script's `doGet(e)` needs to return JSON like:

```js
function doGet(e) {
  if (e.parameter.action === 'list' && e.parameter.token === SCRIPT_PROPERTIES.READ_TOKEN) {
    const rows = SpreadsheetApp.getActiveSheet().getDataRange().getValues();
    const header = rows.shift();
    return ContentService.createTextOutput(JSON.stringify({ rows: rows.map(r => Object.fromEntries(header.map((h,i)=>[h, r[i]]))) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({status:'ok', message:'MomFluence Lead Capture is running'}));
}
```

Then run `npm run import:sheet` from the platform repo with `APPS_SCRIPT_READ_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` set in the env.

## Verify the deploy

Once Vercel finishes the build:

1. `https://momfluence-platform.vercel.app/` → public landing
2. `/login` → magic link flow
3. After magic link → `/dashboard`, `/offers` (4 mock offers), `/agreements` (4 docs to sign), `/profile`, `/payouts`, `/links`
4. Click "Get my link" on an offer → short link minted at `/t/{8-char-token}` that 302s through to the upstream URL with `aff_sub1={token}` baked in
5. Test the postback (after you set `POSTBACK_SECRET`):
   ```
   curl "https://momfluence-platform.vercel.app/api/postback?network=mock&offer=mock-001&sub_id={paste-token-from-step-4}&payout_cents=5000&event=test_evt_1&status=approved&token={your-POSTBACK_SECRET}"
   ```
   Then refresh `/payouts` — you should see a $45 approved conversion.
