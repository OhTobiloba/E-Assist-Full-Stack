'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2600);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto w-[calc(100%-2rem)] max-w-[390px] rounded-xl bg-ink px-4 py-2.5 text-center text-xs font-medium text-[#EDE9DD] transition-all duration-200 ${
          msg ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        {msg}
      </div>
    </ToastContext.Provider>
  );
}
