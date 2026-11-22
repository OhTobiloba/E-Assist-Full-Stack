'use client';
// [NEW] Overview
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatNaira } from '@/lib/utils';
import { PageHead, StatCard } from '@/components/admin/ui';

export default function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { adminApi.overview().then(setS); }, []);
  return (
    <>
      <PageHead title="Overview" sub="Snapshot of what needs attention right now." />
      <div className="grid max-w-3xl grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open tasks" value={s?.openTasks ?? '·'} />
        <StatCard label="Pending KYC" value={s?.pendingKyc ?? '·'} tone="warn" />
        <StatCard label="Active disputes" value={s?.activeDisputes ?? '·'} tone="alert" />
        <StatCard label="Today's escrow volume" value={s ? formatNaira(s.todayVolume) : '·'} />
      </div>
      <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-muted">
        As volume grows, these four numbers should drive daily attention: verification backlog, task health, disputes needing a decision, and money moving through escrow.
      </p>
    </>
  );
}
