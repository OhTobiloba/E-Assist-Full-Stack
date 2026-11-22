# E·Assist: Frontend (Phases 0, 1 and 2)

Mobile-first web app for the E·Assist errand marketplace. Built to the clickable prototype (`e_assist_prototype_v2`) and the *Frontend Learning Tracker*.

**Stack:** Next.js 14 (App Router) · React 18 · Tailwind CSS · Socket.io client
**Status:** Phases 0 to 2 complete as a working front end running on a built-in demo backend.

## What is built

| Phase | Tracker items | Screens (route) |
|---|---|---|
| **0 Setup** | #1 | Project scaffold, routing, Tailwind theme (prototype colours and fonts), shared UI components, API layer |
| **1 Auth** | #2 to #8 | Landing/Splash `/` · Signup `/signup` · OTP `/otp` · Login `/login` (OTP or password) · Role selection `/role` · Profile setup `/profile-setup` · KYC upload + status `/kyc` |
| **2 Marketplace** | #9 to #15 | Task feed with filters `/home` · Create task `/tasks/new` · My tasks `/tasks/mine` · Task detail + status stepper `/tasks/[id]` · In-task chat `/tasks/[id]/chat` · Completion / confirmation `/tasks/[id]/complete` · Notifications `/notifications` |

**Not included yet (later phases):** Wallet, Withdraw (Phase 3) · Ratings, Profile/Settings, Admin panel, Disputes (Phase 4) · full QA pass (Phase 5).

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

See **SETUP_GUIDE.md** for accounts, GitHub push, and Vercel hosting.

## Demo mode vs real backend

`NEXT_PUBLIC_USE_MOCK=true` (default): `lib/mockApi.js` acts as the backend, storing data in the browser. `NEXT_PUBLIC_USE_MOCK=false`: `lib/api.js` calls your Express API using the endpoints from the Backend Backlog. Screens never change; only that one switch does.

## 3-minute walkthrough for your report

1. Open the site → **Get started** → enter any Nigerian number + name → enter any 6 digits.
2. Choose **Both** → fill the profile → upload any two images on KYC → watch the badge go *Pending → Approved* (about 10 seconds in demo).
3. As **Customer**: **+ New task** → fill the form (note the fee preview) → Post.
4. On the task page tap **"Demo: simulate an assistant accepting"** → open **Chat** (a simulated reply arrives) → tap the demo link again to simulate finishing → **Review & confirm** → Confirm.
5. Check **Alerts** (unread badge, mark as read).
6. Use the **Customer / Assistant** switch at the top → browse the **Task feed**, try the filters → open a task → **Accept**.

Quick login for reviewers: `0803 000 0001` (any OTP / password).

## Project structure

```
app/                  Screens (Next.js App Router)
  (app)/              Logged-in screens (guarded by app/(app)/layout.js)
components/           Reusable UI (buttons, fields, OTP boxes, task card, stepper, nav…)
lib/
  api.js              The ONE place that talks to the backend (real calls)
  mockApi.js          Demo backend (same function names as api.js)
  chat.js             Socket.io client (+ simulated chat for demo)
  auth.js             Session context, onboarding routing
  config.js           Env vars and constants
```

## Notes

- Search the code for `INPUT NEEDED` to find everything you must confirm when connecting the real backend.
- Money formatting uses `Intl.NumberFormat` (₦). The 15% fee shown on Create Task is a UI preview; the backend is the source of truth.

---
## v2 update
Payments UI (wallet, fund, withdraw, escrow, cancel fees), disputes, and the Admin Panel (`/admin`) were added, and the app can now talk to the real backend (`e-assist-api`). See **CHANGES.md** for every new/changed file.
Demo admin: `/admin/login` → `admin@eassist.app` / `admin1234`.
