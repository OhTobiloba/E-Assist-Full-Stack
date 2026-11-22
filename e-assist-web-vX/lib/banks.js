// [NEW] Fallback bank list (Paystack bank codes). 
// INPUT NEEDED (Phase 3): when GET /wallet/banks exists on your backend (it proxies Paystack's "List Banks"),
// the Withdraw screen loads the live list automatically and this file is only a fallback.
// Double-check codes at https://paystack.com/docs/api/miscellaneous/#bank before going live.
export const BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'FCMB', code: '214' },
  { name: 'GTBank', code: '058' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Stanbic IBTC', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'UBA', code: '033' },
  { name: 'Union Bank', code: '032' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];
