'use client';
// [NEW] Separate auth context for staff (tracker task #20). Does not touch the customer/assistant session.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearAdminToken, getAdminToken, setAdminToken } from './session';
import { USE_MOCK } from './config';

const Ctx = createContext(null);
export const useAdminAuth = () => useContext(Ctx);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Demo: the token itself proves login. Real backend: add GET /admin/me and validate here.
    // INPUT NEEDED (Phase 4): call GET /admin/me with the admin token to confirm it is still valid.
    if (getAdminToken()) setAdmin({ name: 'E Assist Admin' });
    setReady(true);
  }, []);

  const signIn = useCallback((token, a) => {
    setAdminToken(token);
    setAdmin(a);
  }, []);
  const signOut = useCallback(() => {
    clearAdminToken();
    setAdmin(null);
  }, []);

  return <Ctx.Provider value={{ admin, ready, signIn, signOut, demo: USE_MOCK }}>{children}</Ctx.Provider>;
}
