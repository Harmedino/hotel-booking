const moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const moneyShort = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const money = (n) => moneyFmt.format(Number(n) || 0);
export const moneyRound = (n) => moneyShort.format(Math.round(Number(n) || 0));
export const compact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n || 0);

// Dates from the API are plain 'YYYY-MM-DD'; format them without timezone shifts.
const asDate = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`);
export const shortDate = (iso) => (iso ? asDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
export const longDate = (iso) =>
  iso ? asDate(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
export const dateRange = (a, b) => `${shortDate(a)} – ${shortDate(b)}`;

export const toIso = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const todayIso = () => toIso(new Date());
export const addDaysIso = (iso, n) => {
  const d = asDate(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const nightsBetween = (a, b) => (a && b ? Math.round((asDate(b) - asDate(a)) / 86400000) : 0);

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const relativeTime = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(-Math.round(diff / secs), unit);
  }
  return 'just now';
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
