'use client';
// [NEW] Raise a dispute (customer, only while "awaiting confirmation"). Mockup: "RAISE A DISPUTE".
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { BackHeader, Button, ErrorNote, SectionLabel, Spinner, TextArea } from '@/components/ui';

const REASONS = [
  ["Task wasn't actually completed", 'not_delivered'],
  ['Wrong item / wrong outcome', 'wrong_item'],
  ['Item damaged in the process', 'damaged'],
  ['Something else', 'other'],
];

export default function DisputePage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getTask(id).then(setTask).catch((e) => setError(e.message));
  }, [id]);

  async function submit() {
    if (!reason) return setError('Choose what went wrong.');
    setBusy(true);
    setError('');
    try {
      await api.raiseDispute(id, { reason, details });
      toast('Dispute submitted. We will review it.');
      router.replace(`/tasks/${id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!task) return error ? <div className="p-[18px]"><ErrorNote message={error} /></div> : <Spinner />;
  return (
    <div className="flex flex-1 flex-col">
      <BackHeader title="Raise a dispute" href={`/tasks/${id}/complete`} />
      <div className="flex-1 px-[18px]">
        <ErrorNote message={error} />
        <SectionLabel>What went wrong?</SectionLabel>
        {REASONS.map(([label, key]) => (
          <button key={key} onClick={() => setReason(label)}
            className={`mb-2 block w-full rounded-[10px] border px-3.5 py-3 text-left text-xs ${reason === label ? 'border-navy bg-paper font-semibold' : 'border-line text-muted'}`}>
            {label}
          </button>
        ))}
        <div className="mt-3"><TextArea label="Add details" placeholder="Explain what happened. This goes to E Assist support along with your chat history." value={details} onChange={(e) => setDetails(e.target.value)} /></div>
        <div className="rounded-[10px] bg-amber-bg p-3 text-[11px] leading-relaxed text-amber-dark">
          Your {formatNaira(task.budget)} stays locked in escrow (not released to {task.assistant?.name}, not refunded to you) until E Assist reviews this and decides.
        </div>
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button loading={busy} onClick={submit}>Submit dispute</Button>
      </div>
    </div>
  );
}
