'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { EmptyState, ErrorNote, Spinner } from '@/components/ui';

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await api.notifications());
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function open(n) {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x))); // update locally first
      api.markNotificationRead(n.id).catch(() => {}); // then tell the API
    }
    if (n.taskId) router.push(`/tasks/${n.taskId}`);
  }

  async function markAll() {
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    api.markAllNotificationsRead().catch(() => {});
  }

  const unread = items?.filter((n) => !n.read).length || 0;
  return (
    <div className="flex-1 px-[18px] pb-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-xl font-medium">Alerts</h1>
        {unread > 0 && <button onClick={markAll} className="text-[11px] font-semibold text-navy underline">Mark all read</button>}
      </div>
      <ErrorNote message={error} onRetry={load} />
      {!items && !error && <Spinner />}
      {items?.length === 0 && <EmptyState title="All caught up" text="Task updates and payment alerts will show up here." />}
      {items?.map((n) => (
        <button key={n.id} onClick={() => open(n)} className="mb-2 flex w-full items-start gap-3 rounded-xl border border-line bg-white p-3.5 text-left">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-amber'}`} />
          <span className="flex-1">
            <span className={`block text-[13px] ${n.read ? 'font-medium' : 'font-semibold'}`}>{n.title}</span>
            <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{n.body}</span>
            <span className="mt-1.5 block text-[10px] text-muted">{timeAgo(n.createdAt)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
