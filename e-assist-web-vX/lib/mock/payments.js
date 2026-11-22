// [NEW] Demo wallet: balance, funding (simulated Paystack), bank resolve, withdrawals.
import { WITHDRAW_MIN, WALLET_FUND_MIN } from '../config';
import { addTxn, currentUser, delay, fail, load, save, walletOf } from '../mockApi';
import { BANKS } from '../banks';

const pendingFunding = {}; // reference -> amount (lives only for the session, fine for a demo)

export const mockPayments = {
  async getWallet() {
    await delay(300);
    const db = load();
    const u = currentUser(db);
    const mine = db.txns
      .filter((t) => t.userId === u.id)
      .map((t) => (t.status === 'pending' && Date.now() - t.createdAt > 8000 ? { ...t, status: 'success' } : t)); // withdrawals "land" after 8s
    return { balance: walletOf(db, u.id).balance, transactions: mine };
  },
  async fundWallet({ amount }) {
    await delay(300);
    if (!(amount >= WALLET_FUND_MIN)) fail(`Minimum funding amount is ₦${WALLET_FUND_MIN}.`);
    const db = load();
    const u = currentUser(db);
    const reference = `MOCK_${Date.now()}`;
    pendingFunding[reference] = amount;
    return { reference, email: u.email || 'demo@eassist.app', mock: true };
  },
  async verifyFunding(reference) {
    await delay(600);
    const amount = pendingFunding[reference];
    if (!amount) fail('Payment not found or already processed.', 404);
    delete pendingFunding[reference];
    const db = load();
    const u = currentUser(db);
    const w = walletOf(db, u.id);
    w.balance += amount;
    addTxn(db, { userId: u.id, type: 'deposit', title: 'Wallet funded', subtitle: 'Paystack · card', amount });
    save(db);
    return { status: 'success', balance: w.balance };
  },
  async listBanks() {
    await delay(200);
    return BANKS;
  },
  async resolveAccount({ accountNumber, bankCode }) {
    await delay(700);
    if (!/^\d{10}$/.test(accountNumber)) fail('Account number must be 10 digits.');
    if (!BANKS.some((b) => b.code === bankCode)) fail('Choose a bank.');
    if (accountNumber === '0000000000') fail('Could not verify this account. Check the number and bank.', 422);
    const db = load();
    const u = currentUser(db);
    return { accountName: u.name.toUpperCase() };
  },
  async withdraw({ amount, bankCode, accountNumber }) {
    await delay(900);
    const db = load();
    const u = currentUser(db);
    const w = walletOf(db, u.id);
    if (!(amount >= WITHDRAW_MIN)) fail(`Minimum withdrawal is ₦${WITHDRAW_MIN.toLocaleString()}.`);
    if (amount > w.balance) fail('Amount is more than your available balance.', 402);
    const bank = BANKS.find((b) => b.code === bankCode);
    w.balance -= amount;
    addTxn(db, { userId: u.id, type: 'withdrawal', title: `Withdrawal to ${bank?.name || 'bank'}`, subtitle: `•••• ${accountNumber.slice(-4)}`, amount: -amount, status: 'pending' });
    save(db);
    return { status: 'pending', balance: w.balance };
  },
};
