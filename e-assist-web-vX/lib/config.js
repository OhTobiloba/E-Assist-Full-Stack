// [CHANGED] added FEATURES, fee constants, Paystack key. (Everything above "FEATURES" is unchanged.)

// Defaults to demo mode so the hosted site works with zero backend.
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

// INPUT NEEDED (when USE_MOCK=false): set these in .env.local / Vercel env vars.
const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
export const API_URL = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`;
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

// Shown on the Create Task screen (matches the prototype: 15%).
// The backend is the source of truth for the real fee (backend task #17).
export const COMMISSION_RATE = 0.15;

export const CATEGORIES = ['Documents', 'Errand', 'Shopping', 'Corporate'];

export const BUDGET_MIN = 500;
export const BUDGET_MAX = 500000;

// ───────────────────────── [NEW] Payments / Admin additions ─────────────────────────

// Turn screens on/off per backend readiness. In demo mode everything is on.
// With the real backend: Phase 3 API ready -> set NEXT_PUBLIC_FEATURE_PAYMENTS=true
//                        Phase 4 API ready -> set NEXT_PUBLIC_FEATURE_ADMIN=true (also enables "Raise a dispute")
export const FEATURES = {
  payments: USE_MOCK || process.env.NEXT_PUBLIC_FEATURE_PAYMENTS === 'true',
  admin: USE_MOCK || process.env.NEXT_PUBLIC_FEATURE_ADMIN === 'true',
};

// Must match the backend .env (CANCEL_FEE_RATE). Used only for the explanatory text before cancelling.
export const CANCEL_FEE_RATE = 0.1;
export const AUTO_RELEASE_HOURS = 48;

export const WALLET_FUND_MIN = 500;
export const WITHDRAW_MIN = 1000;

// INPUT NEEDED (Phase 3): your Paystack PUBLIC key (starts with pk_test_ or pk_live_).
// Safe to expose in the browser. NEVER put the secret key (sk_...) in the frontend.
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
