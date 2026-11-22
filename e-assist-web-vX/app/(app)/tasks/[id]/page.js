'use client';
// [CHANGED] statuses (in_progress/disputed/cancelled), cancel rules + fee explanation, assistant "cancel & reopen",
// escrow label, dispute-under-review banner, assistant demo shortcut. Search [NEW] / [CHANGED].
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AUTO_RELEASE_HOURS, CANCEL_FEE_RATE, FEATURES, USE_MOCK } from '@/lib/config';
import { formatDeadline, formatNaira } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import Stepper from '@/components/Stepper';
import { Avatar, btn, Button, ErrorNote, SectionLabel, Spinner, StatusPill } from '@/components/ui';

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false); // [NEW] inline confirm panel instead of window.confirm

  const load = useCallback(async () => {
    setError('');
    try {
      setTask(await api.getTask(id));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  async function run(fn, okMsg) {
    setBusy(true);
    setError('');
    try {
      setTask(await fn());
      if (okMsg) toast(okMsg);
      setConfirmCancel(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !task) return <div className="p-[18px]"><ErrorNote message={error} onRetry={load} /></div>;
  if (!task) return <Spinner />;

  const isCustomer = task.customer.id === user.id;
  const isAssistant = task.assistant?.id === user.id;
  const other = isCustomer ? task.assistant : task.customer;
  const kycOk = user.kycStatus === 'approved';
  const canChat = ['in_progress', 'awaiting_confirmation', 'disputed', 'completed'].includes(task.status) && (isCustomer || isAssistant);
  const live = ['open', 'in_progress'].includes(task.status);
  const fee = Math.round(task.budget * CANCEL_FEE_RATE);

  // [NEW] explains the money consequences BEFORE the person confirms (mockup: cancel confirmation)
  let cancelMsg = '';
  if (isCustomer && task.status === 'open') cancelMsg = `No assistant has accepted yet, so this is a free cancellation. ${formatNaira(task.budget)} is refunded to your wallet immediately.`;
  if (isCustomer && task.status === 'in_progress') cancelMsg = `${task.assistant?.name} has already accepted. A ${formatNaira(fee)} cancellation fee goes to them as compensation; the remaining ${formatNaira(task.budget - fee)} is refunded to you.`;
  if (isAssistant && task.status === 'in_progress') cancelMsg = `This reopens the task for other assistants nearby. ${task.customer.name} will be notified. No fee applies to you, but repeated cancellations are visible to E Assist.`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-navy px-[18px] pb-5 pt-5 text-[#EDE9DD]">
        <button onClick={() => router.back()} className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm" aria-label="Back">‹</button>
        <div className="text-[11px] opacity-70">{task.category} · {task.pickup} → {task.dropoff}</div>
        <h1 className="mt-1.5 font-display text-lg font-medium leading-snug">{task.title}</h1>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="font-display text-2xl text-amber">{formatNaira(task.budget)}</span>
            {/* [NEW] escrow label from the mockup */}
            {FEATURES.payments && task.escrowHeld !== false && live && <span className="ml-2 text-[11px] opacity-70">in escrow</span>}
            {FEATURES.payments && task.status === 'disputed' && <span className="ml-2 text-[11px] opacity-70">locked in escrow</span>}
          </div>
          <StatusPill status={task.status} />
        </div>
      </div>

      {task.status !== 'cancelled' && <Stepper status={task.status} />}

      <div className="flex-1 px-[18px] pb-4">
        {error && <div className="mt-3"><ErrorNote message={error} /></div>}

        <div className="mt-4 flex items-center gap-2.5">
          <Avatar name={task.customer.name} />
          <div>
            <div className="text-[13px] font-semibold">{task.customer.name}</div>
            <div className="text-[11px] text-muted">{task.customer.rating ? `★ ${task.customer.rating}` : 'New'} · {task.customer.tasksPosted} tasks posted</div>{/* [CHANGED] rating can be null */}
          </div>
        </div>

        {task.description && <p className="mt-3.5 text-xs leading-relaxed">{task.description}</p>}
        {task.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={task.photoUrl} alt="Task" className="mt-3 max-h-48 rounded-xl object-cover" />
        )}

        <SectionLabel>Pickup</SectionLabel>
        <div className="text-xs">{task.pickup}</div>
        <SectionLabel>Drop-off</SectionLabel>
        <div className="text-xs">{task.dropoff}</div>
        <SectionLabel>Needed by</SectionLabel>
        <div className="text-xs">{formatDeadline(task.deadline)}</div>

        {task.assistant && (
          <>
            <SectionLabel>Assistant</SectionLabel>
            <div className="flex items-center gap-2.5 text-xs"><Avatar name={task.assistant.name} size={28} />{task.assistant.name}</div>
          </>
        )}

        {task.status === 'awaiting_confirmation' && isAssistant && (
          <div className="mt-4 rounded-[10px] bg-amber-bg p-3 text-[11px] text-amber-dark">
            Waiting for {task.customer.name} to confirm. If they don&apos;t respond within {AUTO_RELEASE_HOURS} hours, payment releases to you automatically.
          </div>
        )}
        {task.status === 'disputed' && ( // [NEW]
          <div className="mt-4 rounded-[10px] bg-bad-bg p-3 text-[11px] text-bad">Under E Assist review. The funds stay locked until we decide. You&apos;ll get a notification.</div>
        )}
        {task.status === 'completed' && (
          <div className="mt-4 rounded-[10px] bg-ok-bg p-3 text-[11px] text-ok">This task is complete. Ratings arrive in Phase 4.</div>
        )}
        {task.status === 'cancelled' && (
          <div className="mt-4 rounded-[10px] bg-bad-bg p-3 text-[11px] text-bad">Cancelled{FEATURES.payments && isCustomer ? '. Refund processed.' : '.'}</div>
        )}
        {!isCustomer && !isAssistant && task.status === 'open' && !kycOk && (
          <div className="mt-4 rounded-[10px] bg-amber-bg p-3 text-[11px] text-amber-dark">
            Verify your identity to accept tasks. <Link href="/kyc" className="font-semibold underline">Verify now</Link>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-white px-[18px] pb-5 pt-4">
        {/* [NEW] cancel confirmation panel */}
        {confirmCancel ? (
          <div>
            <div className="mb-3 rounded-[10px] bg-amber-bg p-3 text-[11px] leading-relaxed text-amber-dark">{cancelMsg}</div>
            <Button variant="danger" loading={busy} onClick={() => run(() => api.cancelTask(task.id), isAssistant ? 'Task reopened' : 'Task cancelled')}>
              {isAssistant ? 'Yes, cancel & reopen' : isCustomer && task.status === 'in_progress' ? 'Yes, cancel with fee' : 'Yes, cancel & refund'}
            </Button>
            <button onClick={() => setConfirmCancel(false)} className="mt-3 w-full text-center text-[11px] text-muted underline">Keep this task</button>
          </div>
        ) : (
          <>
            {!isCustomer && !isAssistant && task.status === 'open' && (
              <Button loading={busy} disabled={!kycOk} onClick={() => run(() => api.acceptTask(task.id), 'Task accepted ✓')}>Accept task</Button>
            )}
            {isAssistant && task.status === 'in_progress' && (
              <Link href={`/tasks/${task.id}/complete`} className={btn('primary')}>Mark as complete</Link>
            )}
            {isCustomer && task.status === 'awaiting_confirmation' && (
              <Link href={`/tasks/${task.id}/complete`} className={btn('primary')}>Review &amp; confirm</Link>
            )}
            {canChat && (
              <Link href={`/tasks/${task.id}/chat`} className={`${btn('ghost')} ${task.status === 'open' ? '' : 'mt-2'}`}>Chat with {other?.name}</Link>
            )}
            {/* TODO (needs a backend "edit task" endpoint, not in the current backlog): add an Edit button here. */}
            {((isCustomer && live) || (isAssistant && task.status === 'in_progress')) && (
              <button onClick={() => setConfirmCancel(true)} className="mt-3 w-full text-center text-[11px] text-bad">
                {isAssistant ? "Can't complete this? Cancel & reopen" : task.status === 'open' ? 'Cancel task (full refund)' : 'Cancel task'}
              </button>
            )}
            {/* DEMO ONLY: play the other side during a presentation */}
            {USE_MOCK && ((isCustomer && live) || (isAssistant && task.status === 'awaiting_confirmation')) && (
              <button onClick={() => run(() => api.devAdvanceTask(task.id), 'Demo step applied')} disabled={busy} className="mt-3 w-full text-center text-[11px] text-amber-dark underline">
                Demo: simulate {isAssistant ? 'the customer confirming' : task.status === 'open' ? 'an assistant accepting' : 'the assistant finishing'} this task
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
