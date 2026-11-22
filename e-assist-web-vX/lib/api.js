// [CHANGED] (1) request() now auto-refreshes an expired access token  (2) realApi gained wallet/dispute/logout
// endpoints  (3) mock API is merged with lib/mock/payments.js.  Search for [NEW] / [CHANGED].
import { API_URL, USE_MOCK } from './config';
import { getRefreshToken, getToken, setRefreshToken, setToken } from './session';
import { mockApi } from './mockApi';
import { mockPayments } from './mock/payments'; // [NEW]

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// [NEW] One refresh at a time, even if several requests fail together.
let refreshing = null;
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  refreshing ||= fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const d = await r.json();
      setToken(d.token);
      setRefreshToken(d.refreshToken);
      return true;
    })
    .catch(() => false)
    .finally(() => (refreshing = null));
  return refreshing;
}

export async function rawRequest(path, { method = 'GET', body, form, token, retry = true } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form; // FormData: the browser sets the multipart header itself
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 0);
  }
  const data = await res.json().catch(() => null);

  // [NEW] expired access token -> refresh once and replay the request
  if (res.status === 401 && retry && token && getRefreshToken() && (await refreshAccessToken())) {
    return rawRequest(path, { method, body, form, token: getToken(), retry: false });
  }
  // INPUT NEEDED: if your backend wraps responses (e.g. { success, data }) or names the error
  // field differently, adjust these lines. (The E·Assist API in /e-assist-api returns plain JSON + `message`.)
  if (!res.ok) throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status);
  return data;
}

const request = (path, opts = {}) => rawRequest(path, { ...opts, token: getToken() }); // [CHANGED] token passed explicitly

function toForm(obj) {
  const f = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') f.append(k, v);
  });
  return f;
}

// INPUT NEEDED: every path/field below follows the backend in /e-assist-api (and its docs/API.md).
const realApi = {
  // ---- Phase 1: Auth ----
  signup: ({ phone, name }) => request('/signup', { method: 'POST', body: { phone, name } }),
  sendOtp: ({ phone }) => request('/otp/send', { method: 'POST', body: { phone } }), // [CHANGED] may return { devOtp } in dev
  verifyOtp: ({ phone, code }) => request('/otp/verify', { method: 'POST', body: { phone, code } }), // -> { token, refreshToken, user }
  login: ({ phone, password }) => request('/login', { method: 'POST', body: { phone, password } }), // -> { token, refreshToken, user }
  logout: () => request('/auth/logout', { method: 'POST', body: { refreshToken: getRefreshToken() || undefined } }), // [NEW]
  me: () => request('/me'),
  updateRole: ({ roles }) => request('/profile/role', { method: 'PATCH', body: { roles } }),
  switchRole: (role) => request('/profile/role', { method: 'PATCH', body: { activeRole: role } }),
  updateProfile: ({ name, email, homeArea, password, photo }) => // [CHANGED] optional password
    request('/profile', { method: 'PATCH', form: toForm({ name, email, homeArea, password, photo }) }),
  uploadKyc: ({ idDoc, selfie }) => request('/kyc/upload', { method: 'POST', form: toForm({ idDoc, selfie }) }),
  kycStatus: () => request('/kyc/status'), // -> { status: 'none'|'pending'|'approved'|'rejected' }

  // ---- Phase 2: Marketplace ----
  listTasks: ({ lat, lng, radiusKm, category, minBudget } = {}) => { // [CHANGED] optional filters
    const q = new URLSearchParams();
    Object.entries({ lat, lng, radiusKm, category, minBudget }).forEach(([k, v]) => v != null && q.set(k, v));
    return request(`/tasks?${q.toString()}`);
  },
  myTasks: ({ role }) => request(`/tasks/mine?role=${role}`),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: ({ photo, ...values }) => request('/tasks', { method: 'POST', form: toForm({ ...values, photo }) }),
  acceptTask: (id) => request(`/tasks/${id}/accept`, { method: 'POST' }),
  cancelTask: (id) => request(`/tasks/${id}/cancel`, { method: 'POST' }),
  completeTask: (id, { proof }) => request(`/tasks/${id}/complete`, { method: 'POST', form: toForm({ proof }) }),
  confirmTask: (id) => request(`/tasks/${id}/confirm`, { method: 'POST' }),
  chatHistory: (id) => request(`/tasks/${id}/messages`),
  notifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // ---- [NEW] Phase 3: Payments (backend endpoints to build; contract in docs/API_CONTRACT_PHASE3_4.md) ----
  getWallet: () => request('/wallet'), // -> { balance, transactions: [...] }   (already live in /e-assist-api)
  fundWallet: ({ amount }) => request('/wallet/fund', { method: 'POST', body: { amount } }), // -> { reference, email }
  verifyFunding: (reference) => request(`/wallet/verify/${encodeURIComponent(reference)}`), // -> { status, balance }
  listBanks: () => request('/wallet/banks'), // -> [{ name, code }]
  resolveAccount: ({ accountNumber, bankCode }) => request(`/wallet/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`), // -> { accountName }
  withdraw: ({ amount, bankCode, accountNumber }) => request('/wallet/withdraw', { method: 'POST', body: { amount, bankCode, accountNumber } }),

  // ---- [NEW] Phase 4: Disputes ----
  raiseDispute: (id, { reason, details }) => request(`/tasks/${id}/report`, { method: 'POST', body: { reason, details } }),
};

// [CHANGED] mock = base mock + payments mock
export const api = USE_MOCK ? { ...mockApi, ...mockPayments } : realApi;
