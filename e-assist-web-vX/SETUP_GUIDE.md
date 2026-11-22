# E·Assist: Setup Guide (accounts, installs, and inputs you need to do)

Read this top to bottom once. Everything in **Part 1** is required to get the project live.
**Part 2** is only for later, when you connect a real backend.

---

## Part 1: Required now (Phase 0 to 2 demo)

### A. Install on your computer (one time)

| Tool | Why | Where to get it |
|---|---|---|
| **Node.js** (LTS, version 20 or newer) | Runs and builds the project | https://nodejs.org (download the "LTS" button) |
| **Git** | Pushes your code to GitHub | https://git-scm.com/downloads |
| **VS Code** (optional but recommended) | Code editor | https://code.visualstudio.com |

Check the installs worked. Open a terminal and run:

```bash
node -v     # should print v20.x or higher
npm -v
git --version
```

### B. Create these accounts (free)

1. **GitHub** (https://github.com): stores your code.
2. **Vercel** (https://vercel.com): hosts the website. Choose **"Continue with GitHub"** when signing up. The free *Hobby* plan is enough (it is meant for personal / non-commercial projects; when E·Assist goes commercial, review Vercel's terms or move to another host).

No other accounts are needed for the demo. There are no API keys to paste.

### C. Run it on your computer

```bash
cd e-assist-web
npm install            # downloads dependencies (first time only, takes a minute)
cp .env.example .env.local     # on Windows PowerShell: copy .env.example .env.local
npm run dev
```

Open http://localhost:3000. It runs in **demo mode** (`NEXT_PUBLIC_USE_MOCK=true`): sample tasks and a built-in fake backend, so every screen works with no server.

### D. Push to GitHub

1. On GitHub: **New repository** → name it `e-assist-web` → leave it empty (no README) → Create.
2. In your project folder:

```bash
git init
git add .
git commit -m "Phase 0-2: scaffold, auth screens, marketplace screens"
git branch -M main
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/e-assist-web.git   # <-- INPUT: your username
git push -u origin main
```

(`.env.local` is already in `.gitignore`, so no secrets are uploaded.)

### E. Host on Vercel (gets you a public link for the report)

1. Log in to Vercel → **Add New… → Project**.
2. **Import** your `e-assist-web` GitHub repo.
3. Leave all settings as detected (Framework: *Next.js*). You do **not** need to add environment variables for the demo (demo mode is the default).
4. Click **Deploy**. After about a minute you get a link like `https://e-assist-web.vercel.app`. That's the link for your project report.
5. From now on, every `git push` to `main` redeploys automatically.

> Tip for the report: open the link on your phone as well. The app is mobile-first, and on desktop it shows inside a phone-sized frame.

### F. Things in the code marked `INPUT NEEDED`

You can find all of them by searching the project for **`INPUT NEEDED`** (in VS Code: `Ctrl+Shift+F`). **None are required for the demo.** They only matter when you connect the real backend:

| File | What you'll need to fill in / confirm |
|---|---|
| `.env.example` → `.env.local` / Vercel env vars | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, and set `NEXT_PUBLIC_USE_MOCK=false` |
| `lib/api.js` | Confirm each endpoint path and field name matches your Express routes; adjust response unwrapping if your API wraps data |
| `lib/chat.js` | Socket.io namespace, event names (`task:join`, `message:send`, `message:new`) and how the JWT is sent |
| `lib/session.js` | Decide where the JWT is stored (localStorage now; httpOnly cookie is more secure) |
| `app/(app)/tasks/new/page.js` | Address inputs are plain text; swap for a places/maps autocomplete later |
| `next.config.mjs` | Add Cloudinary image domain if you switch to Next `<Image>` |

---

## Part 2: Later (NOT needed for Phase 0 to 2). Accounts for when the backend and payments are built

| Service | Used for | Notes |
|---|---|---|
| **Render / Railway / Fly.io** | Hosting the Express + Socket.io backend | Free tiers change often; check current limits. Free web services may "sleep" when idle. |
| **Neon or Supabase** | Free PostgreSQL database (for Prisma) | Copy the connection string into the *backend's* `.env` |
| **Cloudinary** | Image uploads (KYC, profile and task photos) | Used by the backend (`POST /kyc/upload`) |
| **Paystack** | Wallet funding and withdrawals (Phase 3) | Use **test mode** keys while developing. Public key goes in the frontend; secret key only in the backend. |
| **Termii** | SMS OTP and notifications | Paid per SMS. During development, log OTPs to the backend console instead. |

When your backend is deployed: in Vercel → Project → **Settings → Environment Variables**, add the three variables from `.env.example` (with `NEXT_PUBLIC_USE_MOCK=false`), then **Redeploy**. Your backend must also allow your Vercel URL in its CORS settings.

---

## Troubleshooting

- **`npm install` fails / "unsupported engine"**: update Node.js to the latest LTS.
- **Vercel build fails**: open the failed deployment → *Build Logs*, and send me the red error lines.
- **Login says "No account found"**: the demo database lives in your browser. Use the demo account `0803 000 0001`, or sign up first. On the Landing page you can wipe demo data by clearing the site's storage in your browser (DevTools → Application → Local Storage → Clear).
- **Chat doesn't reply in demo**: replies are simulated about 1.5 seconds after you send.
