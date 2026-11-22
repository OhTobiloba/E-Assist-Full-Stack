'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BackHeader, Button, ErrorNote, Field, FullSpinner } from '@/components/ui';
import FileSlot from '@/components/FileSlot';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [homeArea, setHomeArea] = useState('');
  const [password, setPassword] = useState(''); // [NEW] optional, enables Password login
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    if (user) setName(user.name || '');
  }, [authLoading, user, router]);

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (name.trim().length < 2) errs.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!homeArea.trim()) errs.homeArea = 'Tell us your area so we can show nearby tasks';
    if (password && password.length < 8) errs.password = 'Use at least 8 characters'; // [NEW]
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setApiError('');
    try {
      const updated = await api.updateProfile({ name: name.trim(), email, homeArea, photo, password: password || undefined }); // FormData upload
      setUser(updated);
      router.replace(updated.roles.includes('assistant') ? '/kyc' : '/home');
    } catch (err) {
      setApiError(err.message);
      setLoading(false);
    }
  }

  if (authLoading || !user) return <FullSpinner />;
  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col">
      <BackHeader title="Set up your profile" />
      <div className="flex-1 overflow-y-auto px-[18px]">
        <ErrorNote message={apiError} />
        <div className="mx-auto mb-5 mt-1 w-24">
          <FileSlot round title="Add photo" sub="Optional" file={photo} onFile={setPhoto} className="aspect-square !p-1" />
        </div>
        <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Field label="Email address" type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Field label="Home area" placeholder="e.g. Lekki Phase 1" value={homeArea} onChange={(e) => setHomeArea(e.target.value)} error={errors.homeArea} />
        {/* [NEW] */}
        <Field label="Password (optional)" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint="Lets you log in without waiting for an OTP." />
      </div>
      <div className="border-t border-line px-[18px] pb-5 pt-4">
        <Button type="submit" loading={loading}>Save and continue</Button>
      </div>
    </form>
  );
}
