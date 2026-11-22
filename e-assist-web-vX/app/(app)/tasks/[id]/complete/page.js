'use client';
// [CHANGED] status rename (accepted -> in_progress); customer gets "Raise a dispute" next to Confirm (only if FEATURES.admin);
// 48h auto-release note; release note now reflects wallet payout when payments are on.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AUTO_RELEASE_HOURS, COMMISSION_RATE, FEATURES } from '@/lib/config';
import { formatNaira } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import FileSlot from '@/components/FileSlot';
import { BackHeader, btn, Button, ErrorNote, Spinner } from '@/components/ui';

export default function CompletePage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getTask(id).then(setTask).catch((e) => setError(e.message));
  }, [id]);

  if (!task) return error ? <div className="p-[18px]"><ErrorNote message={error} /></div> : <Spinner />;

  const isAssistant = task.assistant?.id === user.id && task.status === 'in_progress'; // [CHANGED]
  const isCustomer = task.customer.id === user.id && task.status === 'awaiting_confirmation';
  const payout = formatNaira(task.budget - Math.round(task.budget * COMMISSION_RATE)); // [NEW]

  async function act(fn, msg) {
    setBusy(true);
    setError('');
    try {
      await fn();
      toast(msg);
      router.replace(`/tasks/${id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!isAssistant && !isCustomer) {
    return (
      <div className="flex flex-1 flex-col">
        <BackHeader href={`/tasks/${id}`} />
        <p className="px-[18px] text-xs text-muted">Nothing to do here right now for this task.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <BackHeader href={`/tasks/${id}`} />
      <div className="flex-1 px-[18px] pt-2 text-center">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-ok-bg text-2xl text-ok">✓</div>
        <h1 className="font-display text-lg font-medium">{isAssistant ? 'Mark this task complete' : 'Confirm delivery'}</h1>
        <p className="mx-auto mb-5 mt-1.5 max-w-[260px] text-xs leading-relaxed text-muted">
          {isAssistant ? 'Add a photo as proof of completion before notifying the customer.' : `${task.assistant?.name} says "${task.title}" is done. Check the proof, then confirm.`}
        </p>
        <ErrorNote message={error} />
        {isAssistant ? (
          <FileSlot title="Add proof photo" sub="Delivery or receipt photo" file={proof} onFile={setProof} capture="environment" />
        ) : task.proofUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={task.proofUrl} alt="Proof of completion" className="mx-auto max-h-60 rounded-xl" />
        ) : (
          <div className="rounded-xl border border-dashed border-line p-6 text-xs text-muted">No proof photo was attached.</div>
        )}
        {isCustomer && (
          <div className="mt-4 rounded-[10px] bg-amber-bg p-3 text-left text-[11px] leading-relaxed text-amber-dark">
            {FEATURES.payments
              ? `Confirming releases the payment to ${task.assistant?.name} (${payout} after the E Assist fee). If you don't confirm or dispute within ${AUTO_RELEASE_HOURS} hours, it auto-releases.`
              : 'Releasing funds to the assistant is connected in Phase 3 (wallet & escrow). For now this marks the task complete.'}
          </div>
        )}
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        {isAssistant ? (
          <Button loading={busy} onClick={() => act(() => api.completeTask(id, { proof }), 'Customer notified ✓')}>Notify customer</Button>
        ) : (
          <>
            <Button loading={busy} onClick={() => act(() => api.confirmTask(id), 'Task completed ✓')}>Confirm &amp; release</Button>
            {/* [NEW] dispute path (needs Phase 4 backend: POST /tasks/:id/report) */}
            {FEATURES.admin && <Link href={`/tasks/${id}/dispute`} className={`${btn('ghost')} mt-2`}>Raise a dispute</Link>}
          </>
        )}
      </div>
    </div>
  );
}
