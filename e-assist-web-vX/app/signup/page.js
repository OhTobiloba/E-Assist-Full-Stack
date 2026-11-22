'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setPending } from '@/lib/session';
import { normalizePhone } from '@/lib/utils';
import { BackHeader, Button, ErrorNote, Field } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!normalizePhone(phone)) errs.phone = 'Enter a valid Nigerian number, e.g. 0803 123 4567';
    if (name.trim().length < 2) errs.name = 'Enter your full name';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setApiError('');
    try {
      const p = normalizePhone(phone);
      await api.signup({ phone: p, name });
      const r = await api.sendOtp({ phone: p });
      setPending({ phone: p, ctx: 'signup', devOtp: r?.devOtp }); // [CHANGED] devOtp (dev only)
      router.push('/otp');
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
        <h2 className="font-display text-xl font-medium">Create your account</h2>
        <p className="mb-5 mt-1 text-xs text-muted">We&apos;ll text you a code to verify it&apos;s you.</p>
        <ErrorNote message={apiError} />
        <Field label="Phone number" type="tel" inputMode="tel" placeholder="0803 XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
        <Field label="Full name" placeholder="As it appears on your ID" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button type="submit" loading={loading}>Send code</Button>
        <p className="mt-3.5 text-center text-[11px] text-muted">
          Already have an account? <Link href="/login" className="font-semibold text-navy">Log in</Link>
        </p>
      </div>
    </form>
  );
}
