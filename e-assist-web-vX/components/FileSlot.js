'use client';
import { useRef } from 'react';

// Tap-to-upload box with a preview. Used by KYC (ID + selfie) and for photos.
export default function FileSlot({ title, sub, file, onFile, capture, round = false, className = '' }) {
  const ref = useRef(null);
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <>
      <input ref={ref} type="file" accept="image/*" capture={capture} hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`w-full border-[1.5px] p-4 text-center ${round ? 'rounded-full' : 'rounded-xl'} ${
          file ? 'border-solid border-ok' : 'border-dashed border-line'
        } ${className}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mx-auto mb-2 h-20 w-auto rounded-lg object-cover" />
        ) : null}
        <div className="text-xs font-semibold">{file ? `${title} added ✓` : title}</div>
        <div className="mt-0.5 text-[10px] text-muted">{file ? 'Tap to replace' : sub}</div>
      </button>
    </>
  );
}
