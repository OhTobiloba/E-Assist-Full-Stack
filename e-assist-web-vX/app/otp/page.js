'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, nextRouteFor } from '@/lib/auth';
import { USE_MOCK } from '@/lib/config';
import { clearPending, getPending } from '@/lib/session';
import { prettyPhone } from '@/lib/utils';
import { BackHeader, Button, ErrorNote } from '@/components/ui';
import OtpInput from '@/components/OtpInput';

export default function OtpPage() {
  const router = useRouter();
  const { startSession } = useAuth();
  const [pending, setPendingState] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const p = getPending();
    if (!p) router.replace('/login');
    else setPendingState(p);
  }, [router]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  async function verify(e) {
    e?.preventDefault();
    if (code.length !== 6) return setError('Enter the 6-digit code.');
    setLoading(true);
    setError('');
    try {
      const { token, refreshToken, user } = await api.verifyOtp({ phone: pending.phone, code });
      startSession(token, user, refreshToken); // [CHANGED] stores access + refresh token (tracker task #4)
      clearPending();
      router.replace(nextRouteFor(user));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function resend() {
    setError('');
    try {
      const r = await api.sendOtp({ phone: pending.phone });
      if (r?.devOtp) setPendingState((p) => ({ ...p, devOtp: r.devOtp })); // [CHANGED]
      setSeconds(30);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!pending) return null;
  return (
    <form onSubmit={verify} className="flex flex-1 flex-col">
      <BackHeader />
      <div className="flex-1 px-[18px]">
        <h2 className="font-display text-xl font-medium">Enter the code</h2>
        <p className="mb-5 mt-1 text-xs text-muted">Sent to {prettyPhone(pending.phone)}</p>
        <ErrorNote message={error} />
        <OtpInput value={code} onChange={setCode} />
        {USE_MOCK && <p className="mt-2 text-[11px] text-amber-dark">Demo mode: type any 6 digits, e.g. 123456.</p>}
        {/* [NEW] shown only when the backend runs with OTP_DEV_ECHO=true (local/dev). Never appears in production. */}
        {pending.devOtp && (
          <button type="button" onClick={() => setCode(pending.devOtp)} className="mt-2 block w-full rounded-xl bg-amber-bg p-3 text-left text-[11px] text-amber-dark">
            <b>Dev mode:</b> your code is <b>{pending.devOtp}</b> (tap to fill)
          </button>
        )}
        <p className="mt-3 text-[11px] text-muted">
          Didn&apos;t get it?{' '}
          {seconds > 0 ? (
            <b className="text-amber-dark">Resend in 0:{String(seconds).padStart(2, '0')}</b>
          ) : (
            <button type="button" onClick={resend} className="font-semibold text-amber-dark underline">Resend code</button>
          )}
        </p>
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button type="submit" loading={loading}>Verify</Button>
      </div>
    </form>
  );
}
