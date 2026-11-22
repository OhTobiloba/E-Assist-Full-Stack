'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';

export function btn(variant = 'primary') {
  const base = 'block w-full rounded-[10px] px-4 py-3 text-center text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100';
  const v = {
    primary: 'bg-amber text-ink',
    ghost: 'border border-line bg-transparent text-ink',
    danger: 'border border-bad-bg bg-transparent text-bad',
    navy: 'bg-navy text-[#EDE9DD]',
  };
  return `${base} ${v[variant]}`;
}

export function Button({ variant = 'primary', loading, children, className = '', ...rest }) {
  return (
    <button className={`${btn(variant)} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}

export function Wordmark({ className = '' }) {
  return (
    <div className={`font-display font-medium ${className}`}>
      E<span className="text-amber-dark">·</span>Assist
    </div>
  );
}

export function BackHeader({ title, href }) {
  const router = useRouter();
  const back = (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-sm" aria-label="Back">
      ‹
    </span>
  );
  return (
    <div className="flex items-center gap-2.5 px-4 pb-2.5 pt-5">
      {href ? <Link href={href}>{back}</Link> : <button onClick={() => router.back()}>{back}</button>}
      {title && <h1 className="font-display text-base font-medium">{title}</h1>}
    </div>
  );
}

export function Field({ label, error, hint, className = '', ...input }) {
  return (
    <label className={`mb-3.5 block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-medium text-muted">{label}</span>
      <input
        className={`w-full rounded-[9px] border bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-muted/70 focus:border-navy ${
          error ? 'border-bad' : 'border-line'
        }`}
        {...input}
      />
      {hint && !error && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] text-bad">{error}</span>}
    </label>
  );
}

export function TextArea({ label, error, ...rest }) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-[11px] font-medium text-muted">{label}</span>
      <textarea
        rows={3}
        className={`w-full resize-none rounded-[9px] border bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-muted/70 focus:border-navy ${
          error ? 'border-bad' : 'border-line'
        }`}
        {...rest}
      />
      {error && <span className="mt-1 block text-[11px] text-bad">{error}</span>}
    </label>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-xs text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-navy" />
      {label}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
      <div className="font-display text-[15px]">{title}</div>
      <p className="mx-auto mt-1.5 max-w-[240px] text-xs leading-relaxed text-muted">{text}</p>
      {action && <div className="mx-auto mt-4 max-w-[200px]">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="mb-3 rounded-[10px] bg-bad-bg px-3 py-2.5 text-xs text-bad">
      {message}
      {onRetry && (
        <button onClick={onRetry} className="ml-2 font-semibold underline">
          Try again
        </button>
      )}
    </div>
  );
}

// [CHANGED] extra statuses added below (search [NEW])
const PILLS = {
  open: ['Open', 'bg-amber-bg text-amber-dark'],
  accepted: ['In progress', 'bg-navy text-[#EDE9DD]'],
  in_progress: ['In progress', 'bg-navy text-[#EDE9DD]'], // [CHANGED] backend status name
  disputed: ['Under review', 'bg-bad-bg text-bad'], // [NEW]
  active: ['Active', 'bg-ok-bg text-ok'], // [NEW] admin tables
  suspended: ['Suspended', 'bg-bad-bg text-bad'], // [NEW]
  resolved: ['Resolved', 'bg-ok-bg text-ok'], // [NEW]
  success: ['Success', 'bg-ok-bg text-ok'], // [NEW]
  failed: ['Failed', 'bg-bad-bg text-bad'], // [NEW]
  flagged: ['Flagged', 'bg-bad-bg text-bad'], // [NEW]
  awaiting_confirmation: ['Awaiting confirmation', 'bg-amber-bg text-amber-dark'],
  completed: ['Completed', 'bg-ok-bg text-ok'],
  cancelled: ['Cancelled', 'bg-bad-bg text-bad'],
  pending: ['Pending review', 'bg-amber-bg text-amber-dark'],
  approved: ['Approved', 'bg-ok-bg text-ok'],
  rejected: ['Rejected', 'bg-bad-bg text-bad'],
};
export function StatusPill({ status }) {
  const [label, cls] = PILLS[status] || [status, 'bg-paper text-muted'];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${cls}`}>● {label}</span>;
}

export function Avatar({ name, src, size = 32 }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-paper font-semibold text-navy"
    >
      {initials(name)}
    </span>
  );
}

export function SectionLabel({ children }) {
  return <div className="mb-2 mt-4 text-[11px] font-medium text-muted">{children}</div>;
}

// Shown while an auth check or first load is in progress.
export function FullSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}
