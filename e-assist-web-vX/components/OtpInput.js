'use client';
import { useRef } from 'react';

// 6 boxes, auto-focus next, backspace goes back, paste a full code works.
export default function OtpInput({ value, onChange, length = 6 }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setAt = (i, d) => {
    const arr = [...digits];
    arr[i] = d;
    onChange(arr.join(''));
  };

  return (
    <div className="my-1.5 flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          className={`aspect-square w-full min-w-0 rounded-[9px] border text-center font-display text-lg outline-none focus:border-navy ${
            d ? 'border-navy bg-paper' : 'border-line'
          }`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (t) {
              e.preventDefault();
              onChange(t);
              refs.current[Math.min(t.length, length - 1)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
