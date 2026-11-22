export function formatNaira(n) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

// Accepts 0803 000 0001 / 803 000 0001 / +234 803 000 0001. Returns "+2348030000001" or null.
export function normalizePhone(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.startsWith('234')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? `+234${d}` : null;
}

export function prettyPhone(p) {
  if (!p) return '';
  const d = p.replace('+234', '');
  return `+234 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?'
  );
}

export function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export function formatDeadline(ts) {
  if (!ts) return 'No deadline';
  const d = new Date(ts);
  const diff = ts - Date.now();
  if (diff < 0) return 'Overdue';
  const time = d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  const sameDay = d.toDateString() === new Date().toDateString();
  const tomorrow = d.toDateString() === new Date(Date.now() + 864e5).toDateString();
  if (sameDay) return `Today, ${time}`;
  if (tomorrow) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}, ${time}`;
}

// Shrinks an image to a small JPEG data-URL. Used only by the demo (mock) backend,
// so images can be stored in the browser without hitting storage limits.
export function fileToThumbDataUrl(file, max = 360) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
