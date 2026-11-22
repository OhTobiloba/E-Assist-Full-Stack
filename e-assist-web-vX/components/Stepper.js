const STEPS = ['Posted', 'Accepted', 'Delivered', 'Completed'];
// [CHANGED] in_progress (was accepted) + disputed
const INDEX = { open: 0, accepted: 1, in_progress: 1, awaiting_confirmation: 2, disputed: 2, completed: 3 };

export default function Stepper({ status }) {
  const current = INDEX[status] ?? 0;
  return (
    <div className="px-[18px] pt-3">
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded ${i <= current ? 'bg-amber' : 'bg-line'}`} />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 text-[9.5px] font-medium ${i <= current ? 'text-ink' : 'text-muted'}`}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
