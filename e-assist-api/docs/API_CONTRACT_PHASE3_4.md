# Endpoints the NEW frontend screens expect (build these in backend Phase 3 / 4)
Shapes below are what `lib/api.js` / `lib/adminApi.js` in the frontend already call. Amounts are whole naira (convert ×100 for Paystack).

## Phase 3: Payments (turn on with `NEXT_PUBLIC_FEATURE_PAYMENTS=true`, and `ESCROW_ENABLED=true` here)
| Endpoint | Request → Response | Notes |
|---|---|---|
| `GET /wallet` | ✅ already built | `transactions[].amount` is signed (+in / −out) |
| `POST /wallet/fund` | `{amount}` → `{reference, email}` | create a PENDING `DEPOSIT` Transaction with a unique `reference` (min ₦500) |
| `GET /wallet/verify/:reference` | → `{status:'success'\|'pending'\|'failed', balance}` | call Paystack `GET /transaction/verify/:ref` with the SECRET key, check `amount` + `status==='success'`, credit wallet **once** (idempotent) |
| `POST /wallet/webhook` | Paystack → 200 | verify header `x-paystack-signature` = HMAC-SHA512(rawBody, secret). Needs the **raw body**: mount before `express.json()` (see comment in `app.js`). Handle `charge.success`, `transfer.success`, `transfer.failed` (refund the wallet on failure). Register the URL in Paystack Dashboard → Settings → API Keys & Webhooks |
| `GET /wallet/banks` | → `[{name, code}]` | proxy Paystack `GET /bank?country=nigeria`; cache ~24h |
| `GET /wallet/resolve-account?accountNumber&bankCode` | → `{accountName}` | proxy Paystack `GET /bank/resolve`; 422 if not found |
| `POST /wallet/withdraw` | `{amount, bankCode, accountNumber}` → `{status:'pending', balance}` | min ₦1,000; atomically debit wallet → `WITHDRAWAL` txn PENDING → create transfer recipient + initiate Paystack transfer (`balance` source); webhook finalises. **Transfers require a Paystack Business account with transfers enabled (may need OTP disabled/IP whitelisting)** |

## Phase 4: Disputes + Admin (turn on with `NEXT_PUBLIC_FEATURE_ADMIN=true`)
| Endpoint | Request → Response |
|---|---|
| `POST /tasks/:id/report` | customer, task `AWAITING_CONFIRMATION` → create `Dispute`, set task `DISPUTED`, stop auto-release, notify both → task |
| `POST /admin/login` | `{email,password}` → `{token, admin}` (separate JWT with `typ:'admin'`, uses `Admin` table) |
| `GET /admin/overview` | → `{openTasks, pendingKyc, activeDisputes, todayVolume}` |
| `GET /admin/kyc` | → `[{id,name,phone,area,idType,idNumber,role,submittedAt,status}]` |
| `GET /admin/kyc/:id` | → same + `{nameMatches, idImageUrl, selfieUrl}` (use `signedUrl()` in `config/cloudinary.js`) |
| `POST /admin/kyc/:id/approve` · `/reject` | → uses `decideKyc()` in `kyc.service.js` (already written) |
| `GET /admin/users?search=` | → `[{id,name,phone,roles,tasks,rating,status}]` |
| `POST /admin/users/:id/suspend` · `/reactivate` | sets `User.status` (suspended users are already blocked in `middleware/auth.js`) |
| `GET /admin/tasks?search=&status=` | → `[{id,title,customer,assistant,budget,status,flagged,createdAt,updatedAt}]` (add a `flagged` column to Task) |
| `POST /admin/tasks/:id/flag` · `/unflag` | |
| `GET /admin/transactions` | → `[{id,time,type,user,task,amount,commission,status}]` |
| `GET /admin/disputes` · `GET /admin/disputes/:id` | list / detail with `chat` excerpt |
| `POST /admin/disputes/:id/resolve` | `{outcome:'release'\|'refund'\|'split'}` → use `escrow.settle()` (already written and tested): release = `{assistantGross: budget, commissionRate}`, refund = `{refund: budget}`, split = `{assistantGross: floor(budget/2), refund: rest, commissionRate}`; set task COMPLETED/CANCELLED; notify both |
| Ratings (tracker #19) | `POST /tasks/:id/rate {stars,comment}` → recompute `User.ratingAvg/ratingCount` |
