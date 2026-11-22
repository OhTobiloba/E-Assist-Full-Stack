'use client';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Wordmark } from './ui';

// Top bar on the main tabs: wordmark, role switch (only if the user chose both), log out.
// (The full Profile / Settings screen is Phase 4.)
export default function AppHeader() {
  const { user, setUser, logout } = useAuth();
  const both = user?.roles?.length > 1;

  async function switchTo(role) {
    if (role === user.activeRole) return;
    try {
      setUser(await api.switchRole(role));
    } catch {}
  }

  return (
    <header className="flex items-center justify-between px-[18px] pb-2 pt-5">
      <Wordmark className="text-lg" />
      <div className="flex items-center gap-2.5">
        {both && (
          <div className="flex rounded-full border border-line p-0.5 text-[10px] font-semibold">
            {['customer', 'assistant'].map((r) => (
              <button
                key={r}
                onClick={() => switchTo(r)}
                className={`rounded-full px-2.5 py-1 capitalize ${user.activeRole === r ? 'bg-navy text-[#EDE9DD]' : 'text-muted'}`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        <button onClick={logout} className="text-[11px] text-muted underline">
          Log out
        </button>
      </div>
    </header>
  );
}
