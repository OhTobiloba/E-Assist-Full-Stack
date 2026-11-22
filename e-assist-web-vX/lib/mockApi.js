// DEMO BACKEND (browser localStorage). Mirrors lib/api.js.
// [CHANGED v2] db key bumped (old demo data is discarded) · status "accepted" -> "in_progress" · escrow on post/cancel/confirm
// · assistant can cancel & reopen · customer cancel fee · disputes · helper exports for lib/mock/*.js · seed has wallets, txns, users, KYC queue.
import { BUDGET_MAX, BUDGET_MIN, CANCEL_FEE_RATE, CATEGORIES, COMMISSION_RATE } from './config';
import { fileToThumbDataUrl, formatNaira, normalizePhone } from './utils';
import { getToken } from './session';

const KEY = 'eassist_mock_db_v2'; // [CHANGED]
const KYC_AUTO_APPROVE_MS = 10000; // demo: "pending" turns into "approved" after 10 seconds (unless an admin decides first)
const DEMO_PHONE = '+2348030000001';
const H = 3600 * 1000;

export const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
export function fail(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  throw e;
}

// ---------- storage ----------
function seed() {
  const t = Date.now();
  const person = (id, name, rating, tasksPosted) => ({ id, name, rating, tasksPosted });
  const funmi = person('u_funmi', 'Funmi A.', 4.9, 34);
  const chidi = person('u_chidi', 'Chidi N.', 4.7, 12);
  const kemi = person('u_kemi', 'Kemi B.', 4.8, 21);
  const mkUser = (id, phone, name, roles, extra = {}) => ({
    id, phone, name, email: `${name.split(' ')[0].toLowerCase()}@example.com`, photoUrl: null, homeArea: 'Lagos', roles,
    activeRole: roles[0], profileComplete: true, kycStatus: roles.includes('assistant') ? 'approved' : 'none', kycSubmittedAt: null,
    status: 'active', ratingAvg: 4.8, taskCount: 10, ...extra,
  });
  const base = (o) => ({ description: '', photoUrl: null, proofUrl: null, status: 'open', assistant: null, flagged: false, updatedAt: o.createdAt, ...o });
  return {
    users: {
      u_demo: mkUser('u_demo', DEMO_PHONE, 'Demo User', ['customer', 'assistant'], { email: 'demo@eassist.app', homeArea: 'Lekki Phase 1', ratingAvg: 4.9, taskCount: 34 }),
      // [NEW] extra people so the admin "Users" table has content
      u_funmi: mkUser('u_funmi', '+2348030000002', 'Funmi Adeyemi', ['customer', 'assistant'], { ratingAvg: 4.9, taskCount: 34 }),
      u_tobi: mkUser('u_tobi', '+2348030000004', 'Tobi Ogundele', ['assistant'], { ratingAvg: 4.8, taskCount: 61 }),
      u_segun: mkUser('u_segun', '+2348030000005', 'Segun Lawal', ['customer'], { ratingAvg: 4.6, taskCount: 12 }),
      u_chidi_o: mkUser('u_chidi_o', '+2348030000006', 'Chidi Okeke', ['assistant'], { ratingAvg: 3.2, taskCount: 3, status: 'suspended' }),
    },
    wallets: { u_demo: { balance: 42300 }, u_funmi: { balance: 80000 }, u_tobi: { balance: 15000 } }, // [NEW]
    txns: [ // [NEW] newest first. amount is signed from the owner's point of view.
      { id: 'x1', userId: 'u_demo', userName: 'Demo User', type: 'escrow_release', title: 'Task payment released', subtitle: 'Document pickup', amount: 3825, commission: 675, status: 'success', createdAt: t - 2 * H },
      { id: 'x2', userId: 'u_demo', userName: 'Demo User', type: 'withdrawal', title: 'Withdrawal to GTBank', subtitle: '•••• 4471', amount: -15000, commission: 0, status: 'success', createdAt: t - 26 * H },
      { id: 'x3', userId: 'u_demo', userName: 'Demo User', type: 'escrow_release', title: 'Task payment released', subtitle: 'Bank errand', amount: 2550, commission: 450, status: 'success', createdAt: t - 50 * H },
      { id: 'x4', userId: 'u_funmi', userName: 'Funmi A.', type: 'escrow_hold', title: 'Task escrow hold', subtitle: 'Document pickup', amount: -4500, commission: 0, status: 'success', createdAt: t - 5 * H },
    ],
    disputes: [ // [NEW]
      { id: 'd1', taskId: 't_old1', taskTitle: 'Office supply run', amount: 5000, raisedBy: { id: 'u_segun', name: 'Wale A.' }, against: { id: 'u_chidi_o', name: 'Chidi O.' }, reason: 'Item not delivered', details: 'Nothing arrived at the office.', status: 'resolved', outcome: 'refund', createdAt: t - 72 * H },
    ],
    kycQueue: [ // [NEW] applicants waiting in the admin KYC queue
      { id: 'k1', name: 'Ada Musa', phone: '+2348100002291', area: 'Surulere, Lagos', idType: 'NIN', idNumber: '•••• •••• 4821', role: 'Assistant', submittedAt: t - 2 * H, status: 'pending', userId: null },
      { id: 'k2', name: 'Chidi Okeke', phone: '+2348075005560', area: 'Yaba, Lagos', idType: "Driver's licence", idNumber: '•••• •••• 7734', role: 'Assistant', submittedAt: t - 5 * H, status: 'pending', userId: null },
      { id: 'k3', name: 'Bola Fashola', phone: '+2348090001188', area: 'Ikeja, Lagos', idType: 'Passport', idNumber: '•••• •••• 2290', role: 'Assistant', submittedAt: t - 9 * H, status: 'pending', userId: null },
    ],
    tasks: [
      base({ id: 't_seed1', title: 'Pick up signed contract from VI, drop at Ikoyi office', description: 'Document is at the front desk under my name. Needs a signature from the office manager on arrival; photo confirmation required.', category: 'Documents', budget: 4500, pickup: 'Adeola Odeku St, Victoria Island', dropoff: '14 Alexander Avenue, Ikoyi', deadline: t + 5 * H, customer: funmi, distanceKm: 2.1, createdAt: t - 0.4 * H }),
      base({ id: 't_seed2', title: 'Buy 20 branded envelopes from Computer Village', description: 'A4 size, white, with window. Receipt required.', category: 'Corporate', budget: 6000, pickup: 'Computer Village, Ikeja', dropoff: 'Maryland Mall, Maryland', deadline: t + 26 * H, customer: chidi, distanceKm: 4.6, createdAt: t - 2 * H }),
      base({ id: 't_seed3', title: 'Grocery run: 6 items from Ikeja City Mall', description: 'List will be shared in chat once you accept.', category: 'Shopping', budget: 3500, pickup: 'Ikeja City Mall', dropoff: 'Allen Avenue, Ikeja', deadline: t + 8 * H, customer: kemi, distanceKm: 1.2, createdAt: t - 1 * H }),
      base({ id: 't_seed4', title: 'Queue and pay electricity bill at the bank', description: 'Bring the receipt back. I will send the meter number on chat.', category: 'Errand', budget: 2500, pickup: 'Your location', dropoff: 'Surulere, Lagos', deadline: t + 30 * H, customer: funmi, distanceKm: 8.9, createdAt: t - 5 * H }),
      base({ id: 't_seed5', title: 'Collect parcel from courier office, Yaba', description: 'Tracking number provided in chat. ID may be requested.', category: 'Errand', budget: 5200, pickup: 'Herbert Macaulay Way, Yaba', dropoff: 'Gbagada Phase 2', deadline: t + 12 * H, customer: chidi, distanceKm: 6.3, createdAt: t - 3 * H }),
      base({ id: 't_old1', title: 'Office supply run', category: 'Corporate', budget: 5000, pickup: 'Computer Village', dropoff: 'Wale A. office', deadline: t - 70 * H, customer: person('u_segun', 'Wale A.', 4.6, 12), assistant: { id: 'u_chidi_o', name: 'Chidi O.' }, status: 'cancelled', flagged: true, distanceKm: 3, createdAt: t - 80 * H, updatedAt: t - 60 * H }),
    ],
    notifications: [],
    messages: {},
  };
}
export function load() {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const db = seed();
  save(db);
  return db;
}
export function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}
export function resetMockDb() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

// ---------- helpers (exported for lib/mock/*.js) ----------
export function currentUser(db) {
  const token = getToken();
  const id = token && token.startsWith('mock.') ? token.slice(5) : null;
  const u = id && db.users[id];
  if (!u) fail('Your session has expired. Please log in again.', 401);
  return u;
}
export function pub(u) {
  if (u.kycStatus === 'pending' && u.kycSubmittedAt && Date.now() - u.kycSubmittedAt > KYC_AUTO_APPROVE_MS) u.kycStatus = 'approved';
  const { id, phone, name, email, photoUrl, homeArea, roles, activeRole, profileComplete, kycStatus } = u;
  return { id, phone, name, email, photoUrl, homeArea, roles, activeRole, profileComplete, kycStatus };
}
export function notify(db, userId, title, body, taskId) {
  db.notifications.unshift({ id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, userId, title, body, taskId: taskId || null, read: false, createdAt: Date.now() });
}
export function findTask(db, id) {
  const t = db.tasks.find((x) => x.id === id);
  if (!t) fail('Task not found.', 404);
  return t;
}
const touch = (t) => (t.updatedAt = Date.now()); // [NEW]

// [NEW] ----- wallet + escrow ledger (same rules as the backend's escrow.service.js) -----
export const walletOf = (db, userId) => (db.wallets[userId] ||= { balance: 0 });
export function addTxn(db, { userId, type, title, subtitle = '', amount, commission = 0, taskId = null, status = 'success' }) {
  db.txns.unshift({ id: `x_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, userId, userName: db.users[userId]?.name || 'User', type, title, subtitle, amount, commission, taskId, status, createdAt: Date.now() });
}
export function holdEscrow(db, user, task) {
  const w = walletOf(db, user.id);
  if (w.balance < task.budget) fail('Insufficient wallet balance. Fund your wallet to post this task.', 402);
  w.balance -= task.budget;
  addTxn(db, { userId: user.id, type: 'escrow_hold', title: 'Task escrow hold', subtitle: task.title, amount: -task.budget, taskId: task.id });
}
// assistantGross + refund must equal budget
export function settleEscrow(db, task, { assistantGross = 0, refund = 0, commissionRate = 0, assistantType = 'escrow_release' }) {
  if (assistantGross > 0 && task.assistant) {
    const commission = Math.round(assistantGross * commissionRate);
    const net = assistantGross - commission;
    walletOf(db, task.assistant.id).balance += net;
    addTxn(db, { userId: task.assistant.id, type: assistantType, title: assistantType === 'cancel_fee' ? 'Cancellation compensation' : 'Task payment released', subtitle: task.title, amount: net, commission, taskId: task.id });
  } else refund += assistantGross;
  if (refund > 0) {
    walletOf(db, task.customer.id).balance += refund;
    addTxn(db, { userId: task.customer.id, type: 'escrow_refund', title: 'Escrow refunded', subtitle: task.title, amount: refund, taskId: task.id });
  }
}

// ---------- the mock API (same shape as realApi in lib/api.js) ----------
export const mockApi = {
  // ===== Phase 1: Auth ===== (unchanged except where marked)
  async signup({ phone, name }) {
    await delay();
    const p = normalizePhone(phone);
    if (!p) fail('Enter a valid Nigerian phone number.');
    const db = load();
    if (Object.values(db.users).some((u) => u.phone === p)) fail('This number is already registered. Please log in instead.');
    const id = `u_${Date.now()}`;
    db.users[id] = { id, phone: p, name: name.trim(), email: '', photoUrl: null, homeArea: '', roles: [], activeRole: null, profileComplete: false, kycStatus: 'none', kycSubmittedAt: null, status: 'active', ratingAvg: 0, taskCount: 0 };
    save(db);
    return { ok: true };
  },
  async sendOtp({ phone }) {
    await delay();
    const p = normalizePhone(phone);
    const db = load();
    if (!p || !Object.values(db.users).some((u) => u.phone === p)) fail('No account found for this number. Create one first.', 404);
    return { ok: true }; // demo: any 6-digit code is accepted
  },
  async verifyOtp({ phone, code }) {
    await delay();
    if (!/^\d{6}$/.test(code)) fail('Enter the 6-digit code.');
    const db = load();
    const u = Object.values(db.users).find((x) => x.phone === normalizePhone(phone));
    if (!u) fail('Account not found.', 404);
    if (u.status === 'suspended') fail('This account is suspended. Contact E Assist support.', 403); // [NEW]
    return { token: `mock.${u.id}`, user: pub(u) };
  },
  async login({ phone, password }) {
    await delay();
    const db = load();
    const u = Object.values(db.users).find((x) => x.phone === normalizePhone(phone));
    if (!u) fail('No account found for this number.', 404);
    if (u.status === 'suspended') fail('This account is suspended. Contact E Assist support.', 403); // [NEW]
    if (!password) fail('Enter your password.');
    return { token: `mock.${u.id}`, user: pub(u) };
  },
  async logout() {
    return { ok: true }; // [NEW]
  },
  async me() {
    await delay(150);
    const db = load();
    const u = currentUser(db);
    if (u.status === 'suspended') fail('This account is suspended.', 403); // [NEW]
    const out = pub(u);
    save(db);
    return out;
  },
  async updateRole({ roles }) {
    await delay();
    const db = load();
    const u = currentUser(db);
    if (!roles?.length) fail('Choose at least one option.');
    u.roles = roles;
    u.activeRole = roles[0];
    save(db);
    return pub(u);
  },
  async updateProfile({ name, email, homeArea, photo }) { // password is accepted by the real API; ignored in demo
    await delay();
    const db = load();
    const u = currentUser(db);
    u.name = name || u.name;
    u.email = email;
    u.homeArea = homeArea;
    if (photo) u.photoUrl = await fileToThumbDataUrl(photo, 160);
    u.profileComplete = true;
    save(db);
    return pub(u);
  },
  async switchRole(role) {
    const db = load();
    const u = currentUser(db);
    if (u.roles.includes(role)) u.activeRole = role;
    save(db);
    return pub(u);
  },
  async uploadKyc({ idDoc, selfie }) {
    await delay(700);
    if (!idDoc || !selfie) fail('Please add both your ID and a selfie.');
    const db = load();
    const u = currentUser(db);
    u.kycStatus = 'pending';
    u.kycSubmittedAt = Date.now();
    // [NEW] appears in the admin KYC queue too
    db.kycQueue.unshift({ id: `k_${Date.now()}`, name: u.name, phone: u.phone, area: u.homeArea || 'Lagos', idType: 'NIN', idNumber: '•••• •••• 0000', role: 'Assistant', submittedAt: Date.now(), status: 'pending', userId: u.id });
    save(db);
    return { status: 'pending' };
  },
  async kycStatus() {
    await delay(200);
    const db = load();
    const u = currentUser(db);
    const out = pub(u);
    save(db);
    return { status: out.kycStatus };
  },

  // ===== Phase 2: Marketplace =====
  async listTasks() {
    await delay();
    const db = load();
    const u = currentUser(db);
    return db.tasks.filter((t) => t.status === 'open' && t.customer.id !== u.id && t.deadline > Date.now()).sort((a, b) => b.createdAt - a.createdAt);
  },
  async myTasks({ role }) {
    await delay();
    const db = load();
    const u = currentUser(db);
    return db.tasks.filter((t) => (role === 'assistant' ? t.assistant?.id === u.id : t.customer.id === u.id)).sort((a, b) => b.createdAt - a.createdAt);
  },
  async getTask(id) {
    await delay(250);
    return findTask(load(), id);
  },
  async createTask({ title, description, category, budget, pickup, dropoff, deadline, photo }) {
    await delay(600);
    const b = Number(budget);
    if (!title || title.trim().length < 5) fail('Give your task a clear title.');
    if (!CATEGORIES.includes(category)) fail('Choose a category.');
    if (!(b >= BUDGET_MIN && b <= BUDGET_MAX)) fail('Budget is outside the allowed range.');
    const db = load();
    const u = currentUser(db);
    const task = {
      id: `t_${Date.now()}`, title: title.trim(), description: (description || '').trim(), category, budget: b, pickup, dropoff,
      deadline: new Date(deadline).getTime(), photoUrl: await fileToThumbDataUrl(photo), proofUrl: null, status: 'open', escrowHeld: true, flagged: false,
      customer: { id: u.id, name: u.name, rating: 5.0, tasksPosted: db.tasks.filter((t) => t.customer.id === u.id).length + 1 },
      assistant: null, distanceKm: 0, createdAt: Date.now(), updatedAt: Date.now(),
    };
    holdEscrow(db, u, task); // [NEW] throws 402 if the wallet can't cover the budget
    db.tasks.unshift(task);
    notify(db, u.id, 'Task posted', `"${task.title}" is live. ${formatNaira(task.budget)} is held in escrow.`, task.id); // [CHANGED]
    save(db);
    return task;
  },
  async acceptTask(id) {
    await delay(500);
    const db = load();
    const u = currentUser(db);
    const t = findTask(db, id);
    if (pub(u).kycStatus !== 'approved') fail('Verify your identity before accepting tasks.', 403);
    if (t.customer.id === u.id) fail('You cannot accept your own task.', 403);
    if (t.status !== 'open') fail('This task was already taken.', 409);
    t.status = 'in_progress'; // [CHANGED] was "accepted"
    t.assistant = { id: u.id, name: u.name };
    touch(t);
    notify(db, t.customer.id, 'Task accepted', `${u.name} accepted "${t.title}".`, t.id);
    notify(db, u.id, 'You accepted a task', `Chat with ${t.customer.name} to get started.`, t.id);
    save(db);
    return t;
  },
  // [CHANGED] cancel rules from the prototype:
  //  customer + open          -> free, full refund
  //  customer + in_progress   -> 10% fee to the assistant, rest refunded
  //  assistant + in_progress  -> free, task re-opens
  async cancelTask(id) {
    await delay(500);
    const db = load();
    const u = currentUser(db);
    const t = findTask(db, id);
    const isCustomer = t.customer.id === u.id;
    const isAssistant = t.assistant?.id === u.id;
    if (!isCustomer && !isAssistant) fail('You are not part of this task.', 403);
    if (t.status === 'awaiting_confirmation') fail('Once delivered, you can confirm or raise a dispute instead of cancelling.', 409);
    if (!['open', 'in_progress'].includes(t.status)) fail('This task can no longer be cancelled.', 409);

    if (isAssistant) {
      t.status = 'open';
      t.assistant = null;
      touch(t);
      notify(db, t.customer.id, 'Assistant cancelled', `${u.name} can't complete "${t.title}". It's open to other assistants again.`, t.id);
    } else {
      const fee = t.status === 'in_progress' ? Math.round(t.budget * CANCEL_FEE_RATE) : 0;
      if (t.escrowHeld !== false) settleEscrow(db, t, { assistantGross: fee, refund: t.budget - fee, assistantType: 'cancel_fee' });
      if (t.assistant) notify(db, t.assistant.id, 'Task cancelled', `"${t.title}" was cancelled by the customer.${fee ? ` You received ${formatNaira(fee)} as compensation.` : ''}`, t.id);
      t.status = 'cancelled';
      touch(t);
      notify(db, u.id, 'Task cancelled', `You cancelled "${t.title}". Your refund is in your wallet.`, t.id);
    }
    save(db);
    return t;
  },
  async completeTask(id, { proof }) {
    await delay(700);
    const db = load();
    const u = currentUser(db);
    const t = findTask(db, id);
    if (t.assistant?.id !== u.id) fail('Only the assigned assistant can do this.', 403);
    if (t.status !== 'in_progress') fail('Task is not in progress.', 409);
    t.status = 'awaiting_confirmation';
    t.proofUrl = await fileToThumbDataUrl(proof);
    t.autoReleaseAt = Date.now() + 48 * H;
    touch(t);
    notify(db, t.customer.id, 'Task marked complete', `${u.name} finished "${t.title}". Please review and confirm.`, t.id);
    save(db);
    return t;
  },
  async confirmTask(id) {
    await delay(600);
    const db = load();
    const u = currentUser(db);
    const t = findTask(db, id);
    if (t.customer.id !== u.id) fail('Only the customer can confirm.', 403);
    if (t.status !== 'awaiting_confirmation') fail('Nothing to confirm yet.', 409);
    if (t.escrowHeld !== false) settleEscrow(db, t, { assistantGross: t.budget, commissionRate: COMMISSION_RATE }); // [NEW] pay the assistant 85%
    t.status = 'completed';
    touch(t);
    if (t.assistant) notify(db, t.assistant.id, 'Task confirmed', `"${t.title}" was confirmed. ${formatNaira(t.budget - Math.round(t.budget * COMMISSION_RATE))} added to your wallet.`, t.id);
    notify(db, u.id, 'Task completed', `"${t.title}" is complete.`, t.id);
    save(db);
    return t;
  },
  // [NEW] customer disputes instead of confirming; escrow stays locked until an admin decides
  async raiseDispute(id, { reason, details }) {
    await delay(600);
    const db = load();
    const u = currentUser(db);
    const t = findTask(db, id);
    if (t.customer.id !== u.id) fail('Only the customer can raise a dispute.', 403);
    if (t.status !== 'awaiting_confirmation') fail('You can only dispute a task that is awaiting your confirmation.', 409);
    if (!reason) fail('Choose what went wrong.');
    t.status = 'disputed';
    touch(t);
    db.disputes.unshift({ id: `d_${Date.now()}`, taskId: t.id, taskTitle: t.title, amount: t.budget, raisedBy: { id: u.id, name: u.name }, against: t.assistant, reason, details: details || '', status: 'open', outcome: null, createdAt: Date.now() });
    if (t.assistant) notify(db, t.assistant.id, 'Dispute raised', `The customer raised a dispute on "${t.title}". E Assist is reviewing.`, t.id);
    notify(db, u.id, 'Dispute received', `We're reviewing "${t.title}". The funds stay locked until we decide.`, t.id);
    save(db);
    return t;
  },
  // DEMO ONLY: lets one person play both sides during a presentation.
  // [CHANGED] now also lets an ASSISTANT simulate the customer confirming (to see the wallet payout).
  async devAdvanceTask(id) {
    await delay(500);
    const db = load();
    const u = currentUser(db);
    const t = findTask(db, id);
    if (t.customer.id === u.id) {
      if (t.status === 'open') {
        t.status = 'in_progress';
        t.assistant = { id: 'u_tobi', name: 'Tobi O.' };
        notify(db, u.id, 'Task accepted', `Tobi O. accepted "${t.title}".`, t.id);
      } else if (t.status === 'in_progress') {
        t.status = 'awaiting_confirmation';
        t.autoReleaseAt = Date.now() + 48 * H;
        notify(db, u.id, 'Task marked complete', `Tobi O. finished "${t.title}". Please review and confirm.`, t.id);
      }
    } else if (t.assistant?.id === u.id && t.status === 'awaiting_confirmation') {
      if (t.escrowHeld !== false) settleEscrow(db, t, { assistantGross: t.budget, commissionRate: COMMISSION_RATE });
      t.status = 'completed';
      notify(db, u.id, 'Task confirmed', `${t.customer.name} confirmed "${t.title}". ${formatNaira(t.budget - Math.round(t.budget * COMMISSION_RATE))} added to your wallet.`, t.id);
    } else fail('Nothing to simulate here.');
    touch(t);
    save(db);
    return t;
  },

  // ===== Chat history + notifications ===== (unchanged)
  async chatHistory(id) {
    await delay(250);
    return load().messages[id] || [];
  },
  addMessage(taskId, senderId, text) {
    const db = load();
    const m = { id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, taskId, senderId, text, createdAt: Date.now() };
    (db.messages[taskId] ||= []).push(m);
    save(db);
    return m;
  },
  async notifications() {
    await delay(250);
    const db = load();
    const u = currentUser(db);
    return db.notifications.filter((n) => n.userId === u.id);
  },
  async markNotificationRead(id) {
    const db = load();
    const n = db.notifications.find((x) => x.id === id);
    if (n) n.read = true;
    save(db);
    return { ok: true };
  },
  async markAllNotificationsRead() {
    const db = load();
    const u = currentUser(db);
    db.notifications.forEach((n) => n.userId === u.id && (n.read = true));
    save(db);
    return { ok: true };
  },
};
