import Link from 'next/link';
import { formatDeadline, formatNaira } from '@/lib/utils';
import { StatusPill } from './ui';

export default function TaskCard({ task, showStatus = false, showDistance = true }) {
  return (
    <Link href={`/tasks/${task.id}`} className="mb-2.5 block rounded-xl border border-line bg-white p-3.5 transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[13px] font-semibold leading-snug">{task.title}</div>
        <div className="shrink-0 font-display text-[15px] font-medium text-navy">{formatNaira(task.budget)}</div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
        {showDistance && task.distanceKm > 0 && <span>{task.distanceKm} km away</span>}
        <span>{formatDeadline(task.deadline)}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="rounded-md bg-paper px-2 py-0.5 text-[10px] font-medium text-navy">{task.category}</span>
        {showStatus && <StatusPill status={task.status} />}
      </div>
    </Link>
  );
}
