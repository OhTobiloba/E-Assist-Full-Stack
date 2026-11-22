'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { BackHeader, btn, Button, ErrorNote, FullSpinner, StatusPill } from '@/components/ui';
import FileSlot from '@/components/FileSlot';

export default function KycPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading, refresh } = useAuth();
  const [status, setStatus] = useState(null); // 'none' | 'pending' | 'approved' | 'rejected'
  const [idDoc, setIdDoc] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const loadStatus = useCallback(async () => {
    try {
      const s = await api.kycStatus();
      setStatus(s.status);
      return s.status;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (user) loadStatus(); // refetch-on-load
  }, [user, loadStatus]);

  // Polling: while "pending", check again every 5 seconds.
  useEffect(() => {
    if (status !== 'pending') return;
    const t = setInterval(async () => {
      const s = await loadStatus();
      if (s === 'approved') {
        toast('Identity verified ✓');
        refresh();
      }
    }, 5000);
    return () => clearInterval(t);
  }, [status, loadStatus, refresh, toast]);

  async function submit() {
    if (!idDoc || !selfie) return setError('Please add both your ID and a selfie.');
    setLoading(true);
    setError('');
    try {
      await api.uploadKyc({ idDoc, selfie }); // two files in one FormData
      setStatus('pending');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user || !status) return <FullSpinner />;
  const showForm = status === 'none' || status === 'rejected';

  return (
    <div className="flex flex-1 flex-col">
      <BackHeader title="Verify your identity" />
      <div className="flex-1 px-[18px] pt-1">
        <ErrorNote message={error} />
        {showForm ? (
          <>
            {status === 'rejected' && <p className="mb-3 text-xs text-bad">Your last submission was rejected. Please upload clearer photos.</p>}
            <div className="space-y-3">
              <FileSlot title="Government ID" sub="NIN, driver's licence or passport" file={idDoc} onFile={setIdDoc} />
              <FileSlot title="Selfie" sub="Clear photo, matching your ID" file={selfie} onFile={setSelfie} capture="user" />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-line p-6 text-center">
            <StatusPill status={status} />
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {status === 'pending'
                ? "We're reviewing your documents. This page updates automatically."
                : "You're verified. You can now accept tasks."}
            </p>
          </div>
        )}
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        {showForm ? (
          <Button onClick={submit} loading={loading}>Submit for review</Button>
        ) : (
          <Link href="/home" className={btn('primary')}>{status === 'approved' ? 'Go to home' : 'Continue to app'}</Link>
        )}
        {showForm && (
          <Link href="/home" className="mt-3.5 block text-center text-[11px] text-muted">Skip for now</Link>
        )}
      </div>
    </div>
  );
}
