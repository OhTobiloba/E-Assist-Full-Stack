'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FEATURES } from '@/lib/config'; // [NEW]

// [CHANGED] Wallet tab added (shown when FEATURES.payments). Profile tab arrives in Phase 4.
const TABS = [
  { href: '/home', label: 'Home', icon: '⌂' },
  { href: '/tasks/mine', label: 'My tasks', icon: '☰' },
  ...(FEATURES.payments ? [{ href: '/wallet', label: 'Wallet', icon: '₦' }] : []), // [NEW]
  { href: '/notifications', label: 'Alerts', icon: '◔' },
];

export default function BottomNav() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .notifications()
      .then((list) => alive && setUnread(list.filter((n) => !n.read).length))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [path]);

  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-line bg-white">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link key={t.href} href={t.href} className={`relative flex-1 pb-3 pt-2.5 text-center ${active ? 'text-ink' : 'text-muted'}`}>
            <span className="relative block text-base">
              {t.icon}
              {t.href === '/notifications' && unread > 0 && (
                <span className="absolute -top-1 left-1/2 ml-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-bad px-1 text-[8px] font-bold text-white">
                  {unread}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold">{t.label}</span>
            {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded bg-amber" />}
          </Link>
        );
      })}
    </nav>
  );
}
