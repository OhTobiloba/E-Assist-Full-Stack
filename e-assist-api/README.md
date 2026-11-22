# E·Assist API (Backend Phases 0, 1, 2)

**Stack:** Node.js 20 · Express · Prisma ORM · PostgreSQL · Socket.io · JWT · Cloudinary · Termii (SMS) · Zod validation

| Phase | What is built |
|---|---|
| **0 Setup** | Express app, standard folder structure, env validation, Prisma schema for **all** tables (Users, Tasks, Wallets, Transactions, Ratings, Disputes, KYC, Messages, Notifications, Admins), error handling, CORS, helmet, rate limiting, seed script |
| **1 Auth** | Signup, **real OTP** (hashed, 5-min expiry, 30s resend cooldown, 5 attempts, SMS via Termii or console), password login, JWT access + rotating refresh tokens, profile + photo upload, role selection/switching, KYC upload (private Cloudinary), KYC status |
| **2 Marketplace** | Create task (photo), feed with category/budget/distance filters, my tasks, task detail, **atomic accept**, cancel (customer free/fee, assistant reopen), complete with proof photo, confirm, 48h auto-release job, **Socket.io chat** (JWT-auth, room per task, persisted), notifications (+ optional SMS), escrow ledger (behind `ESCROW_ENABLED`), read-only `GET /wallet` |

**Not built yet (documented in `docs/API_CONTRACT_PHASE3_4.md`):** Paystack funding/verify/webhook, bank resolve, withdrawals, disputes, ratings, `/admin/*`.

> Read **SETUP_GUIDE.md** first: it lists every account, key and env variable.

## Folder structure
```
prisma/            schema.prisma, seed.js            (database)
scripts/           admin-cli.js                      (approve KYC / credit wallet in dev)
src/
  config/          env.js (validated), db.js, cloudinary.js
  middleware/      auth, validate, upload, rateLimit, error
  modules/<feature>/  *.routes.js (HTTP + validation) + *.service.js (business logic)
    auth · users · kyc · tasks · chat · notifications · wallet
  services/        otp, sms, tokens, notify            (shared helpers)
  sockets/         Socket.io chat server
  jobs/            autoRelease.js                      (48h auto-confirm)
  utils/           ApiError, asyncHandler, phone, geo, serializers
docs/              API.md, API_CONTRACT_PHASE3_4.md
```

## Scripts
`npm run dev` · `npm start` · `npm run db:migrate` · `npm run db:deploy` · `npm run db:seed` · `npm run db:studio` · `npm run cli -- <command>`

## Money rules (from the prototype)
Budget held in escrow when posting (`ESCROW_ENABLED=true`) · 15% commission on release · customer cancel before acceptance = full refund · customer cancel after acceptance = 10% fee to the assistant, rest refunded · assistant cancel = free, task reopens · customer silent for 48h after delivery = auto-release · disputes keep funds locked until an admin resolves (Phase 4).
