// [CHANGED] added refresh-token helpers + admin token helpers (marked [NEW]).
// Where the login tokens live on the device.
// INPUT NEEDED (when real backend is ready): decide with your backend whether tokens are kept in
// memory + httpOnly refresh cookie (more secure) or localStorage (simpler). Only this file changes.
const TOKEN_KEY = 'eassist_token';
const REFRESH_KEY = 'eassist_refresh'; // [NEW]
const ADMIN_TOKEN_KEY = 'eassist_admin_token'; // [NEW] admin has its own, separate session
const PENDING_KEY = 'eassist_pending_otp';

const safe = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};

export const getToken = () => (typeof window === 'undefined' ? null : safe(() => localStorage.getItem(TOKEN_KEY)));
export const setToken = (t) => safe(() => localStorage.setItem(TOKEN_KEY, t));
export const clearToken = () => {
  safe(() => localStorage.removeItem(TOKEN_KEY));
  safe(() => localStorage.removeItem(REFRESH_KEY)); // [CHANGED]
};

// [NEW]
export const getRefreshToken = () => (typeof window === 'undefined' ? null : safe(() => localStorage.getItem(REFRESH_KEY)));
export const setRefreshToken = (t) => t && safe(() => localStorage.setItem(REFRESH_KEY, t));

// [NEW] Admin session (separate from customer/assistant session)
export const getAdminToken = () => (typeof window === 'undefined' ? null : safe(() => localStorage.getItem(ADMIN_TOKEN_KEY)));
export const setAdminToken = (t) => safe(() => localStorage.setItem(ADMIN_TOKEN_KEY, t));
export const clearAdminToken = () => safe(() => localStorage.removeItem(ADMIN_TOKEN_KEY));

// Remembers which phone number the OTP screen is verifying.
export const setPending = (obj) => safe(() => sessionStorage.setItem(PENDING_KEY, JSON.stringify(obj)));
export const getPending = () => safe(() => JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'));
export const clearPending = () => safe(() => sessionStorage.removeItem(PENDING_KEY));
