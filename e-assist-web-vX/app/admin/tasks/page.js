'use client';
// [NEW] Task monitor: search + status filter + flag issues (tracker #22).
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatNaira } from '@/lib/utils';
import { ActionLink, PageHead, StatusPill, Table, Td } from '@/components/admin/ui';

const STATUSES = ['', 'open', 'in_progress', 'awaiting_confirmation', 'disputed', 'completed', 'cancelled'];
const fmt = (ts) => new Date(ts).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function AdminTasks() {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const load = useCallback(() => adminApi.tasks({ search, status }).then(setRows), [search, status]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function flag(t) {
    await adminApi.taskFlag(t.id, !t.flagged);
    load();
  }
  return (
    <>
      <PageHead title="Task monitor" sub="Every task with a timestamp trail. Flag anything that needs attention."
        right={
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search task or person" className="w-56 rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-navy" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-[13px]">
              {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
            </select>
          </div>
        } />
      <Table head={['Task', 'Customer', 'Assistant', 'Budget', 'Created', 'Last update', 'Status', '']} empty={rows && rows.length === 0 ? 'No tasks match.' : null}>
        {rows?.map((t) => (
          <tr key={t.id}>
            <Td className="max-w-[220px] font-semibold">{t.title}</Td>
            <Td>{t.customer}</Td>
            <Td>{t.assistant || '·'}</Td>
            <Td>{formatNaira(t.budget)}</Td>
            <Td>{fmt(t.createdAt)}</Td>
            <Td>{fmt(t.updatedAt)}</Td>
            <Td><div className="flex flex-col items-start gap-1"><StatusPill status={t.status} />{t.flagged && <StatusPill status="flagged" />}</div></Td>
            <Td><ActionLink danger={!t.flagged} onClick={() => flag(t)}>{t.flagged ? 'Unflag' : 'Flag'}</ActionLink></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
