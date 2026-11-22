'use client';
// Landing / Splash: checks the session, then routes to Home (or the next onboarding step) or shows Login/Signup.
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, nextRouteFor } from '@/lib/auth';
import { USE_MOCK } from '@/lib/config';
import { btn, Wordmark } from '@/components/ui';

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace(nextRouteFor(user));
  }, [loading, user, router]);

  const showButtons = !loading && !user;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center px-[26px]">
        <Wordmark className="text-[28px]" />
        <p className="mt-5 font-display text-[22px] leading-[1.35] text-navy">Get things done without leaving your day.</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Post an errand, corporate task or pickup. Someone nearby handles it while you keep working.
        </p>
        {USE_MOCK && (
          <p className="mt-6 inline-block self-start rounded-full bg-amber-bg px-3 py-1 text-[10px] font-semibold text-amber-dark">
            Demo mode · sample data
          </p>
        )}
      </div>
      <div className="min-h-[130px] border-t border-line px-[18px] pb-5 pt-4">
        {showButtons ? (
          <>
            <Link href="/signup" className={btn('primary')}>Get started</Link>
            <Link href="/login" className={`${btn('ghost')} mt-2`}>I already have an account</Link>
          </>
        ) : (
          <p className="pt-6 text-center text-xs text-muted">Loading…</p>
        )}
      </div>
    </div>
  );
}
