// [NEW] Demo data/logic for the Admin Panel. Shares the same browser database as the app,
// so something you do as a customer (post a task, raise a dispute) appears here and vice-versa.
import { COMMISSION_RATE } from '../config';
import { delay, fail, findTask, load, notify, save, settleEscrow } from '../mockApi';
import { formatNaira } from '../utils';

export const MOCK_ADMIN = { email: 'admin@eassist.app', password: 'admin1234' }; // demo credentials only

export const mockAdmin = {
  async login({ email, password }) {
    await delay(500);
    if (email.trim().toLowerCase() !== MOCK_ADMIN.email || password !== MOCK_ADMIN.password) fail('Incorrect email or password.', 401);
    return { token: 'mockadmin', admin: { name: 'E Assist Admin', email: MOCK_ADMIN.email } };
  },

  async overview() {
    await delay(300);
    const db = load();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    return {
      openTasks: db.tasks.filter((t) => t.status === 'open').length,
      pendingKyc: db.kycQueue.filter((k) => k.status === 'pending').length,
      activeDisputes: db.disputes.filter((d) => d.status === 'open').length,
      todayVolume: db.txns.filter((t) => t.type === 'escrow_hold' && t.createdAt >= startOfDay).reduce((s, t) => s + Math.abs(t.amount), 0), // volume = escrow held today
    };
  },

  // ---- KYC ----
  async kycList() {
    await delay(300);
    const db = load();
    // keep demo users' auto-approval in sync with the queue
    db.kycQueue.forEach((k) => {
      const u = k.userId && db.users[k.userId];
      if (u && k.status === 'pending' && u.kycStatus === 'approved') k.status = 'approved';
    });
    save(db);
    return db.kycQueue;
  },
  async kycGet(id) {
    await delay(200);
    const k = load().kycQueue.find((x) => x.id === id);
    if (!k) fail('Applicant not found.', 404);
    return { ...k, nameMatches: true, idImageUrl: null, selfieUrl: null }; // real API returns signed Cloudinary URLs here
  },
  async kycDecide(id, decision) { // 'approved' | 'rejected'
    await delay(500);
    const db = load();
    const k = db.kycQueue.find((x) => x.id === id);
    if (!k) fail('Applicant not found.', 404);
    k.status = decision;
    const u = k.userId && db.users[k.userId];
    if (u) {
      u.kycStatus = decision;
      u.kycSubmittedAt = null;
      notify(db, u.id, decision === 'approved' ? 'Identity verified' : 'Verification rejected', decision === 'approved' ? 'You can now accept tasks.' : 'Please upload clearer photos and try again.');
    }
    save(db);
    return k;
  },

  // ---- Users ----
  async users({ search = '' } = {}) {
    await delay(300);
    const q = search.trim().toLowerCase();
    return Object.values(load().users)
      .filter((u) => u.profileComplete && (!q || u.name.toLowerCase().includes(q) || u.phone.includes(q)))
      .map((u) => ({ id: u.id, name: u.name, phone: u.phone, roles: u.roles, tasks: u.taskCount ?? 0, rating: u.ratingAvg || null, status: u.status || 'active' }));
  },
  async userSetStatus(id, status) { // 'active' | 'suspended'
    await delay(400);
    const db = load();
    if (!db.users[id]) fail('User not found.', 404);
    db.users[id].status = status;
    save(db);
    return { ok: true };
  },

  // ---- Tasks ----
  async tasks({ search = '', status = '' } = {}) {
    await delay(300);
    const q = search.trim().toLowerCase();
    return load().tasks
      .filter((t) => (!status || t.status === status) && (!q || t.title.toLowerCase().includes(q) || t.customer.name.toLowerCase().includes(q) || (t.assistant?.name || '').toLowerCase().includes(q)))
      .map((t) => ({ id: t.id, title: t.title, customer: t.customer.name, assistant: t.assistant?.name || null, budget: t.budget, status: t.status, flagged: !!t.flagged, createdAt: t.createdAt, updatedAt: t.updatedAt || t.createdAt }));
  },
  async taskFlag(id, flagged) {
    await delay(300);
    const db = load();
    const t = findTask(db, id);
    t.flagged = flagged;
    save(db);
    return { ok: true };
  },

  // ---- Transactions ----
  async transactions() {
    await delay(300);
    return load().txns.map((t) => ({ id: t.id, time: t.createdAt, type: t.type, user: t.userName, task: t.subtitle, amount: Math.abs(t.amount), commission: t.commission || 0, status: t.status }));
  },

  // ---- Disputes ----
  async disputes() {
    await delay(300);
    return load().disputes;
  },
  async disputeGet(id) {
    await delay(250);
    const db = load();
    const d = db.disputes.find((x) => x.id === id);
    if (!d) fail('Dispute not found.', 404);
    return { ...d, chat: (db.messages[d.taskId] || []).slice(-6).map((m) => ({ ...m, mine: m.senderId === d.raisedBy.id })) };
  },
  // outcome: 'release' (assistant paid) | 'refund' (customer refunded) | 'split' (50/50)
  async disputeResolve(id, outcome) {
    await delay(700);
    const db = load();
    const d = db.disputes.find((x) => x.id === id);
    if (!d || d.status !== 'open') fail('This dispute is already resolved.', 409);
    const t = findTask(db, d.taskId);
    const half = Math.floor(t.budget / 2);
    if (outcome === 'release') { settleEscrow(db, t, { assistantGross: t.budget, commissionRate: COMMISSION_RATE }); t.status = 'completed'; }
    else if (outcome === 'refund') { settleEscrow(db, t, { refund: t.budget }); t.status = 'cancelled'; }
    else if (outcome === 'split') { settleEscrow(db, t, { assistantGross: half, refund: t.budget - half, commissionRate: COMMISSION_RATE }); t.status = 'completed'; }
    else fail('Choose an outcome.');
    t.updatedAt = Date.now();
    d.status = 'resolved';
    d.outcome = outcome;
    const msg = { release: `The payment of ${formatNaira(t.budget)} was released to the assistant.`, refund: `${formatNaira(t.budget)} was refunded to the customer.`, split: `The amount was split 50/50 between customer and assistant.` }[outcome];
    notify(db, d.raisedBy.id, 'Dispute resolved', `"${t.title}": ${msg}`, t.id);
    if (d.against) notify(db, d.against.id, 'Dispute resolved', `"${t.title}": ${msg}`, t.id);
    save(db);
    return d;
  },
};
