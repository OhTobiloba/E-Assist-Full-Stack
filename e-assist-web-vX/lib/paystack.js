// [NEW] Opens the Paystack checkout popup (real mode). Demo mode does not use this file (see wallet page).
// Docs: https://paystack.com/docs/payments/accept-payments/  (Inline / Popup)
import { PAYSTACK_PUBLIC_KEY } from './config';

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load Paystack. Check your connection.'));
    document.body.appendChild(s);
  });
}

// amountNaira is converted to kobo here. `reference` comes from POST /wallet/fund on your backend.
export async function openPaystack({ email, amountNaira, reference, onSuccess, onClose }) {
  // INPUT NEEDED: set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (pk_test_... while testing)
  if (!PAYSTACK_PUBLIC_KEY) throw new Error('Paystack public key is missing (NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).');
  await loadScript();
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: Math.round(amountNaira * 100),
    currency: 'NGN',
    ref: reference,
    callback: (response) => onSuccess(response.reference), // verify on the backend; never trust this alone
    onClose,
  });
  handler.openIframe();
}
