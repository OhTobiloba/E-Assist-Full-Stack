'use client';
// [NEW] Withdraw: amount, bank + account number (resolved to the account NAME before you can submit). Mockup: "WITHDRAW".
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BANKS } from '@/lib/banks';
import { WITHDRAW_MIN } from '@/lib/config';
import { formatNaira } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { BackHeader, Button, ErrorNote, Field } from '@/components/ui';

export default function WithdrawPage() {
  const router = useRouter();
  const toast = useToast();
  const [balance, setBalance] = useState(null);
  const [banks, setBanks] = useState(BANKS);
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [acct, setAcct] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getWallet().then((w) => setBalance(w.balance)).catch((e) => setError(e.message));
    api.listBanks().then((b) => b?.length && setBanks(b)).catch(() => {}); // falls back to lib/banks.js
  }, []);

  // As soon as bank + 10-digit number are filled, ask the backend (which asks Paystack) who owns the account.
  // (The secret key lives on the backend - the browser never calls Paystack's resolve API directly.)
  useEffect(() => {
    setAccountName('');
    if (!bankCode || acct.length !== 10) return;
    let alive = true;
    setResolving(true);
    setError('');
    api.resolveAccount({ accountNumber: acct, bankCode })
      .then((r) => alive && setAccountName(r.accountName))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setResolving(false));
    return () => { alive = false; };
  }, [bankCode, acct]);

  const n = Number(amount) || 0;
  const bankName = banks.find((b) => b.code === bankCode)?.name;
  const canSubmit = accountName && n >= WITHDRAW_MIN && balance != null && n <= balance;

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await api.withdraw({ amount: n, bankCode, accountNumber: acct });
      toast('Withdrawal requested ✓');
      router.replace('/wallet');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <BackHeader title="Withdraw" href="/wallet" />
      <div className="flex-1 px-[18px]">
        <ErrorNote message={error} />
        <div className="mb-1 text-center">
          <input inputMode="numeric" value={amount ? Number(amount).toLocaleString('en-NG') : ''} placeholder="₦0"
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-transparent text-center font-display text-[34px] outline-none placeholder:text-line" />
          <div className="text-[11px] text-muted">of {balance != null ? formatNaira(balance) : '···'} available · minimum {formatNaira(WITHDRAW_MIN)}</div>
          {balance != null && n > balance && <div className="mt-1 text-[11px] text-bad">That is more than your balance.</div>}
        </div>

        <div className="mb-2 mt-5 text-[11px] font-medium text-muted">Payout account</div>
        <label className="mb-3.5 block">
          <span className="mb-1.5 block text-[11px] font-medium text-muted">Bank</span>
          <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="w-full rounded-[9px] border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-navy">
            <option value="">Select your bank</option>
            {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        </label>
        <Field label="Account number" inputMode="numeric" maxLength={10} placeholder="10 digits" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ''))} />

        {resolving && <div className="text-xs text-muted">Checking account…</div>}
        {accountName && (
          <div className="flex items-center gap-3 rounded-xl border border-ok bg-ok-bg p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-[11px] font-semibold text-amber">{bankName?.slice(0, 2).toUpperCase()}</span>
            <div>
              <div className="text-[13px] font-semibold">{accountName}</div>
              <div className="text-[11px] text-muted">{bankName} · •••• {acct.slice(-4)}</div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button disabled={!canSubmit} loading={busy} onClick={submit}>{bankName ? `Withdraw to ${bankName}` : 'Withdraw'}</Button>
      </div>
    </div>
  );
}
