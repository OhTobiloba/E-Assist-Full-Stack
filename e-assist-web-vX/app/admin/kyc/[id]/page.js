'use client';
// [NEW] Applicant file: details + ID/selfie + decision buttons.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { timeAgo } from '@/lib/utils';
import { ErrorNote } from '@/components/ui';
import { PageHead, SolidButton, StatusPill } from '@/components/admin/ui';

export default function KycDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [k, setK] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => { adminApi.kycGet(id).then(setK).catch((e) => setError(e.message)); }, [id]);

  async function decide(decision) {
    setBusy(decision);
    try {
      await adminApi.kycDecide(id, decision);
      router.replace('/admin/kyc');
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  }

  if (!k) return <ErrorNote message={error} />;
  const rows = [['Full name', k.name], ['Phone', k.phone], ['Home area', k.area], ['ID type', k.idType], ['ID number', k.idNumber]];
  return (
    <>
      <Link href="/admin/kyc" className="mb-3 inline-block text-xs text-muted underline">‹ Back to queue</Link>
      <PageHead title={k.name} sub={`Submitted ${timeAgo(k.submittedAt)} · Applying as ${k.role}`} right={<StatusPill status={k.status} />} />
      <ErrorNote message={error} />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-white">
          {rows.map(([a, b]) => (
            <div key={a} className="flex justify-between border-b border-line/60 px-4 py-3 text-[13px] last:border-0"><span className="text-muted">{a}</span><span className="font-medium">{b}</span></div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-2 gap-3">
            {/* INPUT NEEDED (Phase 4): the real API returns signed Cloudinary URLs in idImageUrl / selfieUrl. */}
            {[['🪪', 'Government ID', k.idImageUrl], ['🤳', 'Selfie', k.selfieUrl]].map(([icon, label, url]) => (
              <div key={label} className="flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-white text-xs text-muted">
                {url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={label} className="h-full w-full object-cover" /> : <><span className="text-3xl">{icon}</span>{label}</>}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-ok-bg px-3 py-2 text-xs text-ok">✓ Name on ID matches profile name</div>
        </div>
      </div>
      {k.status === 'pending' && (
        <div className="mt-6 flex gap-3">
          <SolidButton tone="green" loading={busy === 'approved'} onClick={() => decide('approved')}>Approve applicant</SolidButton>
          <SolidButton tone="red" loading={busy === 'rejected'} onClick={() => decide('rejected')}>Reject applicant</SolidButton>
        </div>
      )}
    </>
  );
}
