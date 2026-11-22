'use client';
// [NEW] Small building blocks shared by all admin pages.
import { StatusPill } from '../ui';

export function PageHead({ title, sub, right }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-medium">{title}</h1>
        {sub && <p className="mt-1 max-w-xl text-[13px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
            {head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <div className="px-4 py-10 text-center text-xs text-muted">{empty}</div>}
    </div>
  );
}
export const Td = ({ children, className = '' }) => <td className={`border-b border-line/60 px-4 py-3 ${className}`}>{children}</td>;

export function StatCard({ label, value, tone = '' }) {
  const color = tone === 'warn' ? 'text-amber-dark' : tone === 'alert' ? 'text-bad' : 'text-ink';
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="text-[11px] font-medium text-muted">{label}</div>
      <div className={`mt-2 font-display text-3xl ${color}`}>{value}</div>
    </div>
  );
}

export function ActionLink({ onClick, danger, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`text-xs font-semibold underline disabled:opacity-40 ${danger ? 'text-bad' : 'text-navy'}`}>
      {children}
    </button>
  );
}

export function SolidButton({ onClick, tone = 'navy', loading, children }) {
  const cls = { green: 'bg-ok text-white', red: 'bg-bad text-white', navy: 'bg-navy text-[#EDE9DD]', amber: 'bg-amber text-ink' }[tone];
  return (
    <button onClick={onClick} disabled={loading} className={`rounded-lg px-4 py-2.5 text-xs font-semibold disabled:opacity-50 ${cls}`}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}

export { StatusPill };
