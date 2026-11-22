'use client';
// [NEW] Mobile-first phone frame for the customer/assistant app; the admin panel gets the full page.
import { usePathname } from 'next/navigation';

export default function Shell({ children }) {
  const path = usePathname();
  if (path?.startsWith('/admin')) return <>{children}</>;
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:border sm:border-line sm:shadow-[0_24px_50px_-20px_rgba(20,23,31,0.35)]">
      {children}
    </div>
  );
}
