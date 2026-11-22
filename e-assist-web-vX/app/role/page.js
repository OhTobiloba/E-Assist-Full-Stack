'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BackHeader, Button, ErrorNote, FullSpinner } from '@/components/ui';

const OPTIONS = [
  { key: 'customer', icon: '✓', title: 'I need things done', desc: "Post tasks and errands, pay when they're completed.", roles: ['customer'] },
  { key: 'assistant', icon: '₦', title: 'I want to earn', desc: 'Browse open tasks nearby and get paid for completing them.', roles: ['assistant'] },
  { key: 'both', icon: '⇄', title: 'Both', desc: 'Switch between posting tasks and earning, any time.', roles: ['customer', 'assistant'] },
];

export default function RolePage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();
  const [picked, setPicked] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  async function save() {
    setLoading(true);
    setError('');
    try {
      const roles = OPTIONS.find((o) => o.key === picked).roles;
      setUser(await api.updateRole({ roles }));
      router.push('/profile-setup');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (authLoading || !user) return <FullSpinner />;
  return (
    <div className="flex flex-1 flex-col">
      <BackHeader title="How will you use E Assist?" />
      <div className="flex-1 px-[18px] pt-2">
        <ErrorNote message={error} />
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setPicked(o.key)}
            className={`mb-3 block w-full rounded-2xl p-4 text-left ${picked === o.key ? 'border-2 border-navy' : 'border border-line'}`}
          >
            <div className="mb-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-navy text-[15px] text-amber">{o.icon}</div>
            <div className="font-display text-[15px] font-medium">{o.title}</div>
            <div className="mt-1 text-[11px] leading-snug text-muted">{o.desc}</div>
          </button>
        ))}
        <p className="mt-3 text-[11px] text-muted">You can switch or enable both later.</p>
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button onClick={save} loading={loading}>Continue</Button>
      </div>
    </div>
  );
}
