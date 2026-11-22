'use client';
// [CHANGED] escrow funding on post (button label, wallet balance, "insufficient funds" -> Fund wallet), optional "use my location".
// Search [NEW] / [CHANGED].
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BUDGET_MAX, BUDGET_MIN, CATEGORIES, COMMISSION_RATE, FEATURES } from '@/lib/config';
import { formatNaira } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { BackHeader, Button, ErrorNote, Field, TextArea } from '@/components/ui';
import FileSlot from '@/components/FileSlot';

export default function NewTaskPage() {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ title: '', description: '', category: 'Documents', pickup: '', dropoff: '', budget: '', deadline: '' });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null); // [NEW]
  const [coords, setCoords] = useState(null); // [NEW] optional, enables "within X km" for assistants
  const [insufficient, setInsufficient] = useState(false); // [NEW]
  useEffect(() => {
    if (FEATURES.payments) api.getWallet().then((w) => setBalance(w.balance)).catch(() => {});
  }, []);
  const useMyLocation = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); toast('Location added'); },
      () => toast('Could not get your location'),
      { timeout: 6000 }
    );
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const budget = Number(f.budget) || 0;
  const fee = Math.round(budget * COMMISSION_RATE);

  function validate() {
    const e = {};
    if (f.title.trim().length < 5) e.title = 'Give your task a clear title (at least 5 characters)';
    if (!f.pickup.trim()) e.pickup = 'Where should it be picked up?';
    if (!f.dropoff.trim()) e.dropoff = 'Where should it be delivered?';
    if (!(budget >= BUDGET_MIN && budget <= BUDGET_MAX)) e.budget = `Budget must be between ${formatNaira(BUDGET_MIN)} and ${formatNaira(BUDGET_MAX)}`;
    if (!f.deadline || new Date(f.deadline).getTime() < Date.now()) e.deadline = 'Pick a time in the future';
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setApiError('');
    try {
      const task = await api.createTask({ ...f, budget, photo, ...(coords || {}) }); // [CHANGED] lat/lng optional
      toast('Task posted ✓');
      router.replace(`/tasks/${task.id}`);
    } catch (err) {
      setApiError(err.message);
      setInsufficient(err.status === 402); // [NEW] backend: not enough wallet balance
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col">
      <BackHeader title="New task" href="/home" />
      <div className="flex-1 overflow-y-auto px-[18px]">
        <ErrorNote message={apiError} />
        {insufficient && <Link href="/wallet" className="-mt-1 mb-3 block text-xs font-semibold text-navy underline">Fund your wallet →</Link>}{/* [NEW] */}
        <Field label="What do you need done?" placeholder="e.g. Pick up documents from VI" value={f.title} onChange={set('title')} error={errors.title} />
        <TextArea label="Details (optional)" placeholder="Anything the assistant should know" value={f.description} onChange={set('description')} />

        <div className="mb-3.5">
          <span className="mb-1.5 block text-[11px] font-medium text-muted">Category</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button type="button" key={c} onClick={() => setF((s) => ({ ...s, category: c }))}
                className={`rounded-lg border px-3 py-1.5 text-[11px] ${f.category === c ? 'border-navy bg-navy text-[#EDE9DD]' : 'border-line text-muted'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* INPUT NEEDED (later): replace these text inputs with Google Places autocomplete / a map pin
            once you have a maps API key (Google Maps or free alternative like OpenStreetMap Nominatim). */}
        <Field label="Pickup location" placeholder="Enter address" value={f.pickup} onChange={set('pickup')} error={errors.pickup} />
        <Field label="Drop-off location" placeholder="Enter address" value={f.dropoff} onChange={set('dropoff')} error={errors.dropoff} />
        {/* [NEW] */}
        <button type="button" onClick={useMyLocation} className="-mt-1.5 mb-3.5 text-[11px] font-semibold text-navy underline">{coords ? '📍 Location added' : '📍 Use my current location as the pickup point'}</button>

        <Field label="Your budget (₦)" inputMode="numeric" placeholder="4500" value={f.budget}
          onChange={(e) => setF((s) => ({ ...s, budget: e.target.value.replace(/\D/g, '') }))} error={errors.budget}
          hint={budget >= BUDGET_MIN ? `Assistant receives ${formatNaira(budget - fee)} · E Assist fee ${formatNaira(fee)}` : undefined} />
        <Field label="Needed by" type="datetime-local" value={f.deadline} onChange={set('deadline')} error={errors.deadline} />

        <div className="mb-3.5">
          <span className="mb-1.5 block text-[11px] font-medium text-muted">Photo (optional)</span>
          <FileSlot title="Add a photo" sub="Helps the assistant understand the task" file={photo} onFile={setPhoto} />
        </div>

        {/* [CHANGED] escrow note: real wording from the mockup once payments are on */}
        <div className="mb-4 rounded-[10px] bg-amber-bg p-3 text-[11px] leading-relaxed text-amber-dark">
          {FEATURES.payments
            ? <>Your {budget >= BUDGET_MIN ? formatNaira(budget) : 'budget'} is held in escrow the moment you post. It&apos;s only released to whoever completes the task, or refunded if no one accepts.{balance != null && <> Wallet balance: <b>{formatNaira(balance)}</b>.</>}</>
            : 'Once payments go live, your budget is held in escrow when you post, and only released to whoever completes the task.'}
        </div>
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button type="submit" loading={loading}>{FEATURES.payments ? 'Post task & fund escrow' : 'Post task'}</Button>{/* [CHANGED] */}
      </div>
    </form>
  );
}
