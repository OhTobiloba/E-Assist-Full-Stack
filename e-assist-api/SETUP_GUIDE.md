# E·Assist API: Setup Guide (what YOU must install, create and fill in)

> ⚠️ This code was written and syntax-checked, and the escrow money math was unit-tested, but the full server could not be started in the build environment (no internet to install packages). Expect to fix small things on first run; send me any error text.

<!-- ## 1. Install on your computer
| Tool | Get it |
|---|---|
| Node.js 20 LTS | https://nodejs.org |
| Git | https://git-scm.com |
| (Optional) Postman or just `curl` | to test endpoints | -->

## 2. Accounts and keys

<!-- ### A. Database: Neon (free PostgreSQL) **[REQUIRED]**
1. Sign up at https://neon.tech → **Create project** (any name, region closest to Lagos, e.g. Europe/Frankfurt).
2. On the project dashboard click **Connect** → copy the **connection string** (turn *off* "Pooled connection" for migrations).
3. Paste it into `.env` as `DATABASE_URL=...`. (Supabase also works: Project Settings → Database → Direct connection string.) -->

<!-- ### B. Cloudinary (free): images **[needed for real uploads; optional in local dev]**
1. Sign up at https://cloudinary.com → Dashboard.
2. Copy **Cloud name**, **API Key**, **API Secret** into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. If left empty, uploads are accepted but not stored (KYC will still work in dev; the admin can't see images). **Required in production.** -->

### C. Termii: real SMS OTP **[OPTIONAL now. Needed for real users]**
1. Sign up at https://termii.com, verify your business/ID, fund a small amount.
2. **Sender ID:** request and wait for approval (can take days). Until approved, SMS may not deliver.
3. Put `TERMII_API_KEY`, `TERMII_SENDER_ID` in `.env`, set `SMS_PROVIDER=termii`, and `OTP_DEV_ECHO=false`.
4. Check Termii's current docs (https://developers.termii.com) if the request format has changed; the call is in `src/services/sms.js`.
> **Until then, keep `SMS_PROVIDER=console`**: the OTP is printed in the server terminal AND (with `OTP_DEV_ECHO=true`) shown on the app's OTP screen. That is how you test OTP for free.

<!-- ### D. Hosting the API: Render (free web service) **[for going online]**
Create a Render account → New **Web Service** → connect the GitHub repo → Build command: `npm install && npx prisma migrate deploy` → Start command: `npm start` → add every variable from the table below. Free instances sleep when idle (first request is slow). Railway/Fly.io are alternatives. -->

### E. Paystack **[Phase 3: not needed yet]**
Account at https://paystack.com → Settings → API Keys → copy **test** public + secret keys into `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` later. The secret key stays on the server only.

## 3. First run (local)
<!-- ```bash
cd e-assist-api
npm install                      # also runs "prisma generate"
cp .env.example .env             # Windows: copy .env.example .env
``` -->
<!-- Open `.env` and fill the **[REQUIRED]** values. Generate the three secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # run 3 times: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, OTP_PEPPER
``` -->
<!-- Then create the tables and demo data:
```bash
npx prisma migrate dev --name init     # creates tables AND a prisma/migrations folder -> COMMIT that folder to Git
npm run db:seed                        # demo users + tasks + admin account
npm run dev                            # http://localhost:4000/api/health
``` -->
Quick test (OTP login for the seeded demo user):
```bash
curl -X POST localhost:4000/api/otp/send -H "Content-Type: application/json" -d '{"phone":"08030000001"}'
# -> response contains "devOtp" and the code is printed in the terminal
curl -X POST localhost:4000/api/otp/verify -H "Content-Type: application/json" -d '{"phone":"08030000001","code":"<the code>"}'
```

## 4. Connect the frontend
<!-- In `e-assist-web/.env.local`:
```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000 -->
```
<!-- Restart `npm run dev`. Sign up with a new number → the OTP screen shows a "Dev mode" box with your code.
When the frontend is on Vercel, add its URL to `CLIENT_ORIGINS` on the API (comma-separated) and redeploy the API. -->

## 5. Dev helpers (until the admin panel API exists)
```bash
npm run cli -- kyc-list
npm run cli -- kyc-approve +2348031234567        # or leave KYC_AUTO_APPROVE_SECONDS=10 for automatic approval
npm run cli -- wallet-credit +2348031234567 50000   # fake funding so you can test escrow (ESCROW_ENABLED=true)
```

## 6. All environment variables
| Variable | Required | Meaning |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon/Supabase) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_PEPPER` | ✅ | Random strings ≥32 / 16 chars. Never share or commit |
| `CLIENT_ORIGINS` | ✅ | Allowed frontend URLs (CORS + sockets) |
| `PORT`, `NODE_ENV` |  | default 4000 / development (`production` on Render) |
| `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_DAYS` |  | default 1h / 30 |
| `SMS_PROVIDER` |  | `console` (free dev) or `termii` |
| `OTP_DEV_ECHO` |  | `true` returns the OTP in the API response. **Dev only; server refuses `true` in production** |
| `TERMII_API_KEY`, `TERMII_SENDER_ID`, `TERMII_BASE_URL`, `TERMII_CHANNEL` | if termii | SMS settings |
| `SMS_NOTIFICATIONS` |  | also SMS task events (costs credits) |
| `CLOUDINARY_*` (3) | prod | image storage |
| `KYC_AUTO_APPROVE_SECONDS` |  | dev auto-approve (ignored in production) |
| `ESCROW_ENABLED` |  | `true` = post tasks only if wallet covers budget |
| `COMMISSION_RATE`, `CANCEL_FEE_RATE`, `AUTO_RELEASE_HOURS` |  | 0.15 / 0.10 / 48 |
| `PAYSTACK_*` | Phase 3 | not used yet |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` |  | admin created by `db:seed`. **Change the password** |

## 7. Production checklist
`NODE_ENV=production` · `SMS_PROVIDER=termii` · `OTP_DEV_ECHO=false` · Cloudinary filled · strong secrets · `CLIENT_ORIGINS` = your Vercel URL only · `npx prisma migrate deploy` on each release · never commit `.env`.

## Troubleshooting
- **"Invalid environment configuration"**: a required variable is missing; the message names it.
- **"Cannot connect to the database"**: wrong `DATABASE_URL`, or you skipped `prisma migrate dev`.
- **CORS error in browser**: add the frontend URL to `CLIENT_ORIGINS`.
- **Socket won't connect**: `NEXT_PUBLIC_SOCKET_URL` must be the API root without `/api`.