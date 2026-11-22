'use client';
// [CHANGED] startSession accepts a refresh token; logout revokes it on the server.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import { clearToken, getToken, setRefreshToken, setToken } from './session';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Decides where a logged-in user should land (used by Splash and after login/OTP).
export function nextRouteFor(user) {
  if (!user) return '/login';
  if (!user.roles?.length) return '/role';
  if (!user.profileComplete) return '/profile-setup';
  return '/home';
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session check on first load (tracker task #2: "session check, redirect logic")
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) return alive && setLoading(false);
      try {
        const u = await api.me();
        if (alive) setUser(u);
      } catch {
        clearToken();
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // [CHANGED] third argument: refreshToken (real backend only)
  const startSession = useCallback((token, u, refreshToken) => {
    setToken(token);
    setRefreshToken(refreshToken);
    setUser(u);
  }, []);

  const refresh = useCallback(async () => {
    const u = await api.me();
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    api.logout?.().catch(() => {}); // [NEW] revoke refresh token on the server (best effort)
    clearToken();
    setUser(null);
    router.replace('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, startSession, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
