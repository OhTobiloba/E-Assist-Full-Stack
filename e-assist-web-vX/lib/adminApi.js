// [NEW] All admin calls. Separate token + separate API surface from the customer/assistant app.
// Demo mode uses lib/mock/admin.js. Real mode calls the /admin/* endpoints (build them in backend Phase 4:
// see docs/API_CONTRACT_PHASE3_4.md in the backend repo).
import { USE_MOCK } from './config';
import { getAdminToken } from './session';
import { rawRequest } from './api';
import { mockAdmin } from './mock/admin';

const req = (path, opts = {}) => rawRequest(path, { ...opts, token: getAdminToken(), retry: false });
const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o || {}).forEach(([k, v]) => v && p.set(k, v));
  return p.toString() ? `?${p}` : '';
};

const realAdmin = {
  login: ({ email, password }) => req('/admin/login', { method: 'POST', body: { email, password } }), // -> { token, admin }
  overview: () => req('/admin/overview'),
  kycList: () => req('/admin/kyc'),
  kycGet: (id) => req(`/admin/kyc/${id}`),
  kycDecide: (id, decision) => req(`/admin/kyc/${id}/${decision === 'approved' ? 'approve' : 'reject'}`, { method: 'POST' }),
  users: (q) => req(`/admin/users${qs(q)}`),
  userSetStatus: (id, status) => req(`/admin/users/${id}/${status === 'suspended' ? 'suspend' : 'reactivate'}`, { method: 'POST' }),
  tasks: (q) => req(`/admin/tasks${qs(q)}`),
  taskFlag: (id, flagged) => req(`/admin/tasks/${id}/${flagged ? 'flag' : 'unflag'}`, { method: 'POST' }),
  transactions: () => req('/admin/transactions'),
  disputes: () => req('/admin/disputes'),
  disputeGet: (id) => req(`/admin/disputes/${id}`),
  disputeResolve: (id, outcome) => req(`/admin/disputes/${id}/resolve`, { method: 'POST', body: { outcome } }),
};

export const adminApi = USE_MOCK ? mockAdmin : realAdmin;
