'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, nextRouteFor } from '@/lib/auth';
import { USE_MOCK } from '@/lib/config';
import { setPending } from '@/lib/session';
import { normalizePhone } from '@/lib/utils';
import { BackHeader, Button, ErrorNote, Field } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { startSession } = useAuth();
  const [mode, setMode] = useState('otp'); // 'otp' | 'password'  (conditional rendering)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const p = normalizePhone(phone);
    const errs = {};
    if (!p) errs.phone = 'Enter a valid Nigerian number';
    if (mode === 'password' && !password) errs.password = 'Enter your password';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setApiError('');
    try {
      if (mode === 'otp') {
        const r = await api.sendOtp({ phone: p });
        setPending({ phone: p, ctx: 'login', devOtp: r?.devOtp }); // [CHANGED] devOtp (dev only)
        router.push('/otp');
      } else {
        const { token, refreshToken, user } = await api.login({ phone: p, password });
        startSession(token, user, refreshToken); // [CHANGED]
        router.replace(nextRouteFor(user));
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col">
      <BackHeader href="/" />
      <div className="flex-1 px-[18px]">
        <h2 className="font-display text-xl font-medium">Welcome back</h2>
        <p className="mb-4 mt-1 text-xs text-muted">Log in to continue.</p>

        <div className="mb-4 flex gap-1.5">
          {[['otp', 'OTP login'], ['password', 'Password']].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={`flex-1 rounded-lg border py-2 text-[11px] ${mode === k ? 'border-navy bg-navy text-[#EDE9DD]' : 'border-line text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <ErrorNote message={apiError} />
        <Field label="Phone number" type="tel" inputMode="tel" placeholder="0803 XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
        {mode === 'password' && (
          <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        )}

        {USE_MOCK && (
          <button
            type="button"
            onClick={() => { setPhone('0803 000 0001'); setPassword('demo'); }}
            className="mt-1 w-full rounded-xl bg-amber-bg p-3 text-left text-[11px] leading-relaxed text-amber-dark"
          >
            <b>Demo account</b> (tap to fill): 0803 000 0001. Any 6-digit code works as the OTP, any password works.
          </button>
        )}
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button type="submit" loading={loading}>{mode === 'otp' ? 'Send code' : 'Log in'}</Button>
        <p className="mt-3.5 text-center text-[11px] text-muted">
          New here? <Link href="/signup" className="font-semibold text-navy">Create an account</Link>
        </p>
      </div>
    </form>
  );
}
