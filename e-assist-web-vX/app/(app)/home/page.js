'use client';
// Home: Assistant -> task feed with filters. Customer -> their tasks + "New task".
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORIES } from '@/lib/config';
import MyTasks from '@/components/MyTasks';
import TaskCard from '@/components/TaskCard';
import { EmptyState, ErrorNote, Spinner } from '@/components/ui';

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] ${active ? 'border-ink bg-ink text-paper' : 'border-line text-muted'}`}
    >
      {children}
    </button>
  );
}

function TaskFeed() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [maxKm, setMaxKm] = useState(null);
  const [minBudget, setMinBudget] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setTasks(null);
    try {
      // [CHANGED] send location (if the user allows it) so the server can compute real distances
      const pos = await new Promise((res) => (navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res({}), { timeout: 3000, maximumAge: 600000 }) : res({})));
      setTasks(await api.listTasks(pos));
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Basic client-side filtering (category / distance / budget)
  const visible = useMemo(
    () =>
      (tasks || []).filter(
        (t) => (category === 'All' || t.category === category) && (!maxKm || t.distanceKm <= maxKm) && (!minBudget || t.budget >= minBudget)
      ),
    [tasks, category, maxKm, minBudget]
  );

  return (
    <div className="flex-1 px-[18px] pb-4">
      <h1 className="mb-3 font-display text-xl font-medium">Task feed</h1>
      <div className="no-scrollbar -mx-[18px] mb-1 flex gap-1.5 overflow-x-auto px-[18px]">
        {['All', ...CATEGORIES].map((c) => (
          <Pill key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Pill>
        ))}
      </div>
      <div className="no-scrollbar -mx-[18px] mb-2 mt-1.5 flex gap-1.5 overflow-x-auto px-[18px]">
        <Pill active={maxKm === 3} onClick={() => setMaxKm(maxKm === 3 ? null : 3)}>Within 3 km</Pill>
        <Pill active={maxKm === 10} onClick={() => setMaxKm(maxKm === 10 ? null : 10)}>Within 10 km</Pill>
        <Pill active={minBudget === 5000} onClick={() => setMinBudget(minBudget === 5000 ? null : 5000)}>₦5k+</Pill>
      </div>
      <div className="mb-2 mt-4 text-[11px] font-medium text-muted">Open tasks near you</div>
      <ErrorNote message={error} onRetry={load} />
      {!tasks && !error && <Spinner />}
      {tasks && visible.length === 0 && (
        <EmptyState
          title="No tasks match"
          text={tasks.length ? 'Try removing a filter to see more tasks.' : 'No open tasks right now. Check back soon.'}
        />
      )}
      {visible.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  return user.activeRole === 'assistant' ? <TaskFeed /> : <MyTasks />;
}
