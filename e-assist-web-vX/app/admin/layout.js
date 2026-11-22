'use client';
// [NEW] Admin shell: own auth provider, guard, sidebar with live counts. Logged-out visitors go to /admin/login.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/lib/adminAuth';
import { adminApi } from '@/lib/adminApi';
import { FEATURES } from '@/lib/config';
import { Wordmark } from '@/components/ui';

const NAV = [
  ['/admin', 'Overview'],
  ['/admin/kyc', 'KYC queue', 'pendingKyc'],
  ['/admin/users', 'Users'],
  ['/admin/tasks', 'Tasks'],
  ['/admin/transactions', 'Transactions'],
  ['/admin/disputes', 'Disputes', 'activeDisputes'],
];

function Frame({ children }) {
  const { admin, ready, signOut } = useAdminAuth();
  const router = useRouter();
  const path = usePathname();
  const [counts, setCounts] = useState({});
  const isLogin = path === '/admin/login';

  useEffect(() => {
    if (ready && !admin && !isLogin) router.replace('/admin/login');
  }, [ready, admin, isLogin, router]);

  useEffect(() => {
    if (admin && FEATURES.admin) adminApi.overview().then(setCounts).catch(() => {});
  }, [admin, path]);

  if (isLogin) return <div className="min-h-dvh bg-paper">{children}</div>;
  if (!ready || !admin) return <div className="min-h-dvh bg-paper" />;

  return (
    <div className="flex min-h-dvh bg-paper">
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col bg-ink p-4 text-[#EDE9DD]">
        <div className="mb-6 flex items-baseline gap-2 px-2 pt-2">
          <Wordmark className="text-xl" />
          <span className="text-[11px] opacity-60">admin</span>
        </div>
        {NAV.map(([href, label, key]) => {
          const active = href === '/admin' ? path === '/admin' : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`mb-1 flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] ${active ? 'bg-white/10 font-semibold' : 'opacity-75 hover:opacity-100'}`}>
              <span>{label}</span>
              {key && counts[key] > 0 && <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold text-ink">{counts[key]}</span>}
            </Link>
          );
        })}
        <button onClick={() => { signOut(); router.replace('/admin/login'); }} className="mt-auto rounded-lg px-3 py-2.5 text-left text-[13px] opacity-60 hover:opacity-100">Log out</button>
      </aside>
      <main className="min-w-0 flex-1 p-8">
        {!FEATURES.admin ? (
          <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
            Admin API not connected yet. Build backend Phase 4 (<code>/admin/*</code> endpoints), then set <code>NEXT_PUBLIC_FEATURE_ADMIN=true</code>.
          </div>
        ) : children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <Frame>{children}</Frame>
    </AdminAuthProvider>
  );
}
