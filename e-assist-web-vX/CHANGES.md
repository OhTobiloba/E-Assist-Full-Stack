# Frontend update v2: Payments UI, Admin Panel, backend wiring

## How to apply to your existing project
**Option A (recommended):** unzip `e-assist-web-update-overlay.zip` and copy its folders over your project (merge/replace when asked). It contains ONLY the 21 new + 20 changed files below. Then `npm install` is NOT needed (no new packages).
**Option B:** use `e-assist-web-v2-full.zip` (the whole project).

Every edit inside a changed file is tagged **`[NEW]`** or **`[CHANGED]`**: press `Ctrl+Shift+F` in VS Code and search `[CHANGED]` or `[NEW]` to review each one.
Demo data was reset: the demo database key changed to `v2`, so old browser demo data is ignored automatically.

## NEW files (21)
| File | What it is | Backend endpoints it uses |
|---|---|---|
| `app/(app)/wallet/page.js` | Wallet: balance, Fund wallet (Paystack), history | `GET /wallet`, `POST /wallet/fund`, `GET /wallet/verify/:ref` |
| `app/(app)/wallet/withdraw/page.js` | Withdraw with bank + account-name check | `GET /wallet/banks`, `GET /wallet/resolve-account`, `POST /wallet/withdraw` |
| `app/(app)/tasks/[id]/dispute/page.js` | Raise a dispute | `POST /tasks/:id/report` |
| `app/admin/layout.js`, `login`, `page.js` (overview), `kyc`, `kyc/[id]`, `users`, `tasks`, `transactions`, `disputes`, `disputes/[id]` | Full admin panel (desktop layout, own login) | `/admin/*` (see backend `docs/API_CONTRACT_PHASE3_4.md`) |
| `components/Shell.js` | Phone frame for the app; admin gets full width | – |
| `components/admin/ui.js` | Admin tables/buttons | – |
| `lib/adminApi.js`, `lib/adminAuth.js` | Admin API client + separate admin session | `/admin/*` |
| `lib/paystack.js` | Opens the Paystack popup (needs public key) | – |
| `lib/banks.js` | Fallback bank list | – |
| `lib/mock/payments.js`, `lib/mock/admin.js` | Demo versions of the above | – |

## CHANGED files (20)
| File | What changed |
|---|---|
| `lib/config.js` | `FEATURES` switches, fee constants, Paystack key |
| `lib/api.js` | Auto token refresh on 401; wallet / dispute / logout calls; list-tasks filters |
| `lib/session.js`, `lib/auth.js` | Refresh token storage; admin token; logout revokes server session |
| `lib/chat.js` | Real-mode socket events now match the backend (join with ack, `message:new`) |
| `lib/mockApi.js` | Escrow, wallet, cancel rules (fee / reopen), disputes, extra seed data, status `accepted` → `in_progress` |
| `components/ui.js`, `Stepper.js` | New statuses (`in_progress`, `disputed`, admin pills) |
| `components/BottomNav.js` | Wallet tab (when payments are on) |
| `app/layout.js` | Uses `<Shell>` |
| `app/(app)/layout.js` | `/wallet` counts as a tab page |
| `app/(app)/tasks/new/page.js` | "Post task & fund escrow", wallet balance, insufficient-funds link, optional location |
| `app/(app)/tasks/[id]/page.js` | Cancel confirmation with fee text, assistant "cancel & reopen", escrow labels, dispute banner |
| `app/(app)/tasks/[id]/complete/page.js` | "Raise a dispute", 48h auto-release note, payout amount |
| `app/(app)/home/page.js` | Sends location to the feed for real distances |
| `app/signup`, `login`, `otp`, `profile-setup` | Dev OTP box, refresh token, optional password |
| `.env.example` | New variables |

## Try the new flows in demo mode
1. **Payments:** log in as `0803 000 0001` (wallet ₦42,300) → Wallet tab → Fund wallet → Withdraw (any 10 digits + a bank; the name appears).
2. **Escrow:** New task (budget shown as held) → open it → "Cancel task (full refund)" and watch the wallet; post again → "Demo: simulate an assistant accepting" → cancel → 10% fee text.
3. **Dispute → admin:** post a task → simulate accept → simulate finishing → Review & confirm → **Raise a dispute** → open `/admin/login` (`admin@eassist.app` / `admin1234`) → Disputes → resolve → check Alerts and Wallet in the app.
4. **KYC:** sign up as a new assistant, submit KYC, then approve it from `/admin/kyc` (or wait 10 s for auto-approval).

## Connecting to the real backend (`e-assist-api`)
`.env.local`: `NEXT_PUBLIC_USE_MOCK=false`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`. Payments and Admin screens stay hidden/disabled until you set `NEXT_PUBLIC_FEATURE_PAYMENTS=true` / `NEXT_PUBLIC_FEATURE_ADMIN=true` (after backend Phase 3 / 4).
