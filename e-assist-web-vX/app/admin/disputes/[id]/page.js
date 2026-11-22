'use client';
// [NEW] Dispute detail: reason, chat excerpt, and the three outcomes (release / refund / split 50-50).
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { formatNaira } from '@/lib/utils';
import { ErrorNote } from '@/components/ui';
import { PageHead, SolidButton, StatusPill } from '@/components/admin/ui';

const OUTCOME = { release: 'Released to the assistant', refund: 'Refunded to the customer', split: 'Split 50 / 50' };

export default function DisputeDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => { adminApi.disputeGet(id).then(setD).catch((e) => setError(e.message)); }, [id]);

  async function resolve(outcome) {
    setBusy(outcome);
    try {
      await adminApi.disputeResolve(id, outcome);
      router.replace('/admin/disputes');
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  }
  if (!d) return <ErrorNote message={error} />;
  const open = d.status === 'open';
  return (
    <>
      <Link href="/admin/disputes" className="mb-3 inline-block text-xs text-muted underline">‹ Back to queue</Link>
      <PageHead title={`${d.taskTitle}: dispute`} sub={`Raised by ${d.raisedBy.name} (customer)${d.against ? ` against ${d.against.name} (assistant)` : ''} · ${formatNaira(d.amount)} ${open ? 'held in escrow' : ''}`}
        right={<StatusPill status={open ? 'disputed' : 'resolved'} />} />
      <ErrorNote message={error} />
      <div className="max-w-2xl">
        <div className="mb-1 text-[11px] font-medium text-muted">Reason given</div>
        <p className="mb-5 text-[13px]">{d.reason}{d.details ? `: ${d.details}` : ''}</p>
        <div className="mb-1 text-[11px] font-medium text-muted">Chat excerpt</div>
        <div className="mb-6 space-y-2 rounded-xl border border-line bg-white p-4">
          {d.chat?.length ? d.chat.map((m) => (
            <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${m.mine ? 'ml-auto bg-navy text-[#EDE9DD]' : 'bg-paper'}`}>{m.text}</div>
          )) : <div className="text-xs text-muted">No messages exchanged.</div>}
        </div>
        {open ? (
          <div className="flex flex-wrap gap-3">
            <SolidButton tone="green" loading={busy === 'release'} onClick={() => resolve('release')}>Release {formatNaira(d.amount)} to assistant</SolidButton>
            <SolidButton tone="red" loading={busy === 'refund'} onClick={() => resolve('refund')}>Refund {formatNaira(d.amount)} to customer</SolidButton>
            <SolidButton tone="amber" loading={busy === 'split'} onClick={() => resolve('split')}>Split 50 / 50</SolidButton>
          </div>
        ) : (
          <div className="rounded-lg bg-ok-bg px-4 py-3 text-[13px] text-ok">Resolved: {OUTCOME[d.outcome] || d.outcome}</div>
        )}
      </div>
    </>
  );
}
