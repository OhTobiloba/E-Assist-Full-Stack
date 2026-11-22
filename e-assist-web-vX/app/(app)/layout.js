'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, nextRouteFor } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { FullSpinner } from '@/components/ui';

const TAB_PATHS = ['/home', '/tasks/mine', '/wallet', '/notifications']; // [CHANGED] + /wallet

// Wraps every logged-in screen: blocks access without a session, shows header + tab bar on main tabs.
export default function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (nextRouteFor(user) !== '/home') router.replace(nextRouteFor(user)); // onboarding unfinished
  }, [loading, user, router]);

  if (loading || !user) return <FullSpinner />;
  const isTab = TAB_PATHS.includes(path);
  return (
    <>
      {isTab && <AppHeader />}
      <div className="flex flex-1 flex-col">{children}</div>
      {isTab && <BottomNav />}
    </>
  );
}
