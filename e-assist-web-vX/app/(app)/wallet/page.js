'use client';
// [NEW] Wallet: balance, Fund wallet (Paystack), Withdraw, recent activity. Mockup: "WALLET" screen.
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FEATURES, USE_MOCK, WALLET_FUND_MIN } from '@/lib/config';
import { openPaystack } from '@/lib/paystack';
import { formatNaira, timeAgo } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { Button, EmptyState, ErrorNote, Spinner } from '@/components/ui';

const IN_TYPES = ['deposit', 'escrow_release', 'escrow_refund', 'cancel_fee'];

export default function WalletPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [funding, setFunding] = useState(false); // amount sheet open
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState(null); // demo-only fake Paystack sheet { reference, amount }

  const load = useCallback(async () => {
    setError('');
    try {
      setWallet(await api.getWallet());
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Pending withdrawals flip to "success" - re-check shortly after opening
  useEffect(() => {
    if (!wallet?.transactions.some((t) => t.status === 'pending')) return;
    const t = setTimeout(load, 9000);
    return () => clearTimeout(t);
  }, [wallet, load]);

  async function confirmPayment(reference) {
    try {
      const r = await api.verifyFunding(reference); // backend verifies with Paystack, then credits the wallet
      toast(r.status === 'success' ? 'Wallet funded ✓' : 'Payment is processing…');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckout(null);
      setBusy(false);
    }
  }

  async function startFunding() {
    const n = Number(amount);
    if (!(n >= WALLET_FUND_MIN)) return setError(`Minimum is ${formatNaira(WALLET_FUND_MIN)}.`);
    setBusy(true);
    setError('');
    try {
      const { reference, email } = await api.fundWallet({ amount: n });
      setFunding(false);
      if (USE_MOCK) return setCheckout({ reference, amount: n });
      await openPaystack({
        email: email || user.email,
        amountNaira: n,
        reference,
        onSuccess: confirmPayment,
        onClose: () => setBusy(false),
      });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!FEATURES.payments) {
    return <div className="p-[18px]"><EmptyState title="Payments coming soon" text="The wallet unlocks once the payments backend (Phase 3) is connected." /></div>;
  }

  return (
    <div className="flex-1 px-[18px] pb-4">
      <h1 className="mb-3 font-display text-xl font-medium">Wallet</h1>
      <ErrorNote message={error} onRetry={load} />

      <div className="rounded-2xl bg-navy p-5 text-[#EDE9DD]">
        <div className="text-[11px] opacity-70">Available balance</div>
        <div className="mt-1 font-display text-[32px] leading-none text-amber">{wallet ? formatNaira(wallet.balance) : '···'}</div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => { setFunding(true); setError(''); }} className="flex-1 rounded-[9px] bg-amber py-2.5 text-xs font-semibold text-ink">Fund wallet</button>
          <Link href="/wallet/withdraw" className="flex-1 rounded-[9px] border border-white/30 py-2.5 text-center text-xs font-semibold">Withdraw</Link>
        </div>
      </div>

      <div className="mb-2 mt-5 text-[11px] font-medium text-muted">Recent activity</div>
      {!wallet && !error && <Spinner />}
      {wallet?.transactions.length === 0 && <EmptyState title="No activity yet" text="Funding, escrow and payouts will show up here." />}
      {wallet?.transactions.map((t) => {
        const incoming = IN_TYPES.includes(t.type);
        return (
          <div key={t.id} className="flex items-center justify-between border-b border-line py-3">
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${incoming ? 'bg-ok-bg text-ok' : 'bg-paper text-muted'}`}>{incoming ? '↓' : '↑'}</span>
              <div>
                <div className="text-[13px] font-semibold">{t.title}</div>
                <div className="text-[11px] text-muted">
                  {t.subtitle ? `${t.subtitle} · ` : ''}{timeAgo(t.createdAt)}{t.status === 'pending' ? ' · processing' : ''}
                </div>
              </div>
            </div>
            <div className={`text-[13px] font-semibold ${incoming ? 'text-ok' : 'text-ink'}`}>
              {t.amount > 0 ? '+' : '-'}{formatNaira(Math.abs(t.amount))}
            </div>
          </div>
        );
      })}

      {/* amount sheet */}
      {funding && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50" onClick={() => setFunding(false)}>
          <div className="w-full max-w-[430px] rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-lg">Fund wallet</div>
            <p className="mb-3 mt-1 text-xs text-muted">Pay securely with card, bank transfer or USSD via Paystack.</p>
            <input autoFocus inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="Amount in ₦"
              className="mb-3 w-full rounded-[9px] border border-line px-3 py-3 font-display text-lg outline-none focus:border-navy" />
            <div className="mb-4 flex gap-2">
              {[2000, 5000, 10000].map((n) => (
                <button key={n} onClick={() => setAmount(String(n))} className="flex-1 rounded-lg border border-line py-1.5 text-[11px] text-muted">{formatNaira(n)}</button>
              ))}
            </div>
            <Button onClick={startFunding} loading={busy}>Continue to payment</Button>
          </div>
        </div>
      )}

      {/* DEMO ONLY: stands in for the Paystack popup */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
          <div className="w-full max-w-[340px] rounded-2xl bg-white p-5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Paystack · test checkout (demo)</div>
            <div className="my-3 font-display text-2xl">{formatNaira(checkout.amount)}</div>
            <p className="mb-4 text-[11px] text-muted">In the live app the real Paystack popup appears here.</p>
            <Button loading={busy} onClick={() => { setBusy(true); confirmPayment(checkout.reference); }}>Pay {formatNaira(checkout.amount)}</Button>
            <button onClick={() => { setCheckout(null); setBusy(false); }} className="mt-3 text-[11px] text-muted underline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
