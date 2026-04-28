# MomFluence Platform — live state & 1 thing left

## ✅ What's live

- **Production URL:** https://momfluence-platform.vercel.app
- **Repo:** https://github.com/neverpeakev/momfluence (branch `main`)
- **Supabase:** https://supabase.com/dashboard/project/gndzxfrqfpszqocbsktn (us-east-1, Pro $10/mo)
- **Vercel project:** `prj_FpnpeQiY122gZaviqT1XlqtZJeom` (`momfluence-platform`)

Verified end-to-end:
- `GET /` → public landing (200)
- `GET /login` → magic-link form (200)
- `GET /dashboard`, `/offers`, `/profile`, `/payouts`, `/links`, `/agreements`, `/admin` → 307 redirect to `/login?redirect=...` when not authed (auth gate working)
- 4 mock offers seeded; 4 legal docs seeded; RLS active.

## ⚠️ The one thing I couldn't do

**Add the `SUPABASE_SERVICE_ROLE_KEY` env var.** The Supabase MCP I have access to from this Claude session only exposes anon/publishable keys, not the service role secret. Without it, two routes won't work in production:

- `GET /t/[token]` — the public tracking redirect that logs a click. Currently 404s for unauth'd visitors.
- `POST/GET /api/postback` — receives upstream-network postbacks. Currently 401s.

Everything else (signup, login, dashboard, offers browsing, link generation, agreement signing, profile, payouts view, admin) works on RLS-only and does not need the service role.

### Fix it (2 minutes):

1. Open https://supabase.com/dashboard/project/gndzxfrqfpszqocbsktn/settings/api-keys
2. Copy the value labeled **`service_role`** (looks like `eyJ...` JWT, ~190 chars).
3. Run from `/Users/kevinneal/momfluence-platform`:

   ```bash
   ~/.npm-global/bin/vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # paste the service_role value when prompted
   ~/.npm-global/bin/vercel deploy --prod --yes --force
   ```

That redeploys with the secret loaded, and `/t/[token]` + `/api/postback` light up.

## Make yourself an admin

After your first sign-in via magic link at https://momfluence-platform.vercel.app/login, run this in https://supabase.com/dashboard/project/gndzxfrqfpszqocbsktn/sql/new:

```sql
update public.momfluencers
   set is_admin = true, status = 'approved'
 where email = 'kevin@neverpeakmarketing.com';
```

After that, `/admin` shows pending applicants with Approve/Reject buttons and overall platform stats.

## Smoke test the conversion loop (after service role is set)

Once the service-role key is in:

```bash
# 1. Sign in, generate a tracking link from /offers (note the 8-char token)
# 2. Hit your tracking URL once to log a click:
curl -L "https://momfluence-platform.vercel.app/t/<token>"
# (302s through to https://offers.mock/healthy-smiles?aff_id=momfluence&aff_sub1=<token>)

# 3. Fire a fake postback as the upstream network:
SECRET=$(~/.npm-global/bin/vercel env pull /tmp/.env --yes >/dev/null && grep POSTBACK_SECRET /tmp/.env | cut -d= -f2 | tr -d '"')
curl "https://momfluence-platform.vercel.app/api/postback?network=mock&offer=mock-001&sub_id=<token>&payout_cents=5000&event=evt_test_1&status=approved&token=$SECRET"

# 4. Refresh /payouts → see a $45 approved conversion (5000c gross − 10% margin = 4500c net)
```

## Optional: extend the Apps Script for backfill

The marketing-site forms POST to your Google Apps Script at:
```
https://script.google.com/macros/s/AKfycbwbRJ7wCahXVBuiL1AF2rh1gWyTl9TB-eC61VZCP1bmognjw6yWm7tbUGizxFVKAUgcIg/exec
```
which writes rows to your Sheet. To migrate those rows into Supabase as `momfluencers` rows, the Apps Script's `doGet(e)` needs a `?action=list` branch that returns `{rows:[…]}` JSON. Sketch:

```js
function doGet(e) {
  if (e.parameter.action === 'list' && e.parameter.token === PropertiesService.getScriptProperties().getProperty('READ_TOKEN')) {
    const sheet = SpreadsheetApp.getActiveSheet();
    const [header, ...rows] = sheet.getDataRange().getValues();
    return ContentService
      .createTextOutput(JSON.stringify({ rows: rows.map(r => Object.fromEntries(header.map((h,i)=>[h, r[i]]))) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({status:'ok', message:'MomFluence Lead Capture is running'}));
}
```

Then locally with the env populated:

```bash
APPS_SCRIPT_READ_TOKEN=<token-you-set-in-script-props> \
SUPABASE_SERVICE_ROLE_KEY=<from-step-above> \
NEXT_PUBLIC_SUPABASE_URL=https://gndzxfrqfpszqocbsktn.supabase.co \
APPS_SCRIPT_LEAD_URL=https://script.google.com/macros/s/AKfycbwbRJ7wCahXVBuiL1AF2rh1gWyTl9TB-eC61VZCP1bmognjw6yWm7tbUGizxFVKAUgcIg/exec \
npm run import:sheet
```

## Wire `app.momfluence.app` (when ready)

In Vercel → momfluence-platform → Settings → Domains, add `app.momfluence.app`. DNS record (Cloudflare/Squarespace/wherever momfluence.app is): CNAME `app` → `cname.vercel-dns.com`. Once verified, update `NEXT_PUBLIC_SITE_URL` in Vercel env to `https://app.momfluence.app` and redeploy. Then update the marketing site's `<iframe src>` to point at `app.momfluence.app/admin` instead of `momfluence-platform.vercel.app/admin`.

## Day-2 roadmap (in priority order)

1. **Real network adapter.** Pick one of Everflow / Scaleo / Affise / Offer18 (`lib/adapters/everflow.ts`, etc. are stubs). Whichever you contract with, fill in `fetchOffers`, `buildAffiliateUrl`, `parsePostback`. The mock contract in `lib/adapters/mock.ts` is the spec.
2. **Magic-link emails.** Right now Supabase sends them from a default sender. Configure SMTP in https://supabase.com/dashboard/project/gndzxfrqfpszqocbsktn/auth/templates so the from address is `noreply@momfluence.app` and the magic-link template matches the brand.
3. **Stripe webhook → membership_status.** Currently `momfluencers.membership_status` is `inactive` for everyone. Hook a Stripe webhook (the Payment Link's checkout.completed event) to update the row. The Stripe Payment Link is `https://buy.stripe.com/8x27sLgAE3wx5WK4vCbjW00`.
4. **Payout batch job.** `scripts/run-payout-batch.ts` doesn't exist yet — every 15th, scan `conversions` where `status='approved'` and `approved_at < now() - 30 days`, group by momfluencer, create a `payouts` row + `payout_conversions` rows, mark conversions `paid`. Trigger it via Vercel Cron.
5. **Admin "sync offers" button.** Pull from upstream network adapter, upsert into `offers` table, archive any offers no longer in upstream.
