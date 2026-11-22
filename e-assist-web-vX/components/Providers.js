'use client';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from './Toast';

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
