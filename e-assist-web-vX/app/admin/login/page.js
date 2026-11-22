'use client';
// [NEW] Staff login (tracker #20). Separate from customer login.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { useAdminAuth } from '@/lib/adminAuth';
import { USE_MOCK } from '@/lib/config';
import { Button, ErrorNote, Field, Wordmark } from '@/components/ui';

export default function AdminLogin() {
  const router = useRouter();
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token, admin } = await adminApi.login({ email, password });
      signIn(token, admin);
      router.replace('/admin');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-white p-7">
        <div className="mb-6 flex items-baseline gap-2"><Wordmark className="text-2xl" /><span className="text-xs text-muted">admin</span></div>
        <ErrorNote message={error} />
        <Field label="Staff email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <Button type="submit" loading={loading}>Log in</Button>
        {USE_MOCK && (
          <button type="button" onClick={() => { setEmail('admin@eassist.app'); setPassword('admin1234'); }} className="mt-4 w-full rounded-xl bg-amber-bg p-3 text-left text-[11px] text-amber-dark">
            <b>Demo admin</b> (tap to fill): admin@eassist.app / admin1234
          </button>
        )}
      </form>
    </div>
  );
}
