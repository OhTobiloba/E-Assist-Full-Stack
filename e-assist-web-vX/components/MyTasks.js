'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import TaskCard from './TaskCard';
import { btn, EmptyState, ErrorNote, Spinner } from './ui';

// Customer: tasks I created. Assistant: tasks I accepted.
export default function MyTasks() {
  const { user } = useAuth();
  const role = user.activeRole || 'customer';
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setTasks(null);
    try {
      setTasks(await api.myTasks({ role }));
    } catch (err) {
      setError(err.message);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const isCustomer = role === 'customer';
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-[18px] pb-4">
        <h1 className="mb-3 font-display text-xl font-medium">{isCustomer ? 'Your tasks' : 'Your jobs'}</h1>
        <ErrorNote message={error} onRetry={load} />
        {!tasks && !error && <Spinner />}
        {tasks?.length === 0 && (
          <EmptyState
            title={isCustomer ? 'No tasks yet' : 'No jobs yet'}
            text={isCustomer ? 'Post your first task and an assistant nearby will pick it up.' : 'Accept a task from the Home feed and it will show up here.'}
            action={isCustomer ? <Link href="/tasks/new" className={btn('primary')}>+ New task</Link> : <Link href="/home" className={btn('navy')}>Browse tasks</Link>}
          />
        )}
        {tasks?.map((t) => (
          <TaskCard key={t.id} task={t} showStatus showDistance={false} />
        ))}
      </div>
      {isCustomer && tasks?.length > 0 && (
        <div className="sticky bottom-[58px] z-10 border-t border-line bg-white px-[18px] py-3">
          <Link href="/tasks/new" className={btn('primary')}>+ New task</Link>
        </div>
      )}
    </div>
  );
}
