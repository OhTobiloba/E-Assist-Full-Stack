// "0803 000 0001" | "803 000 0001" | "+234 803 000 0001" -> "+2348030000001" (or null)
export function normalizePhone(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.startsWith('234')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? `+234${d}` : null;
}
