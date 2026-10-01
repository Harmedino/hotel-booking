import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetRoomCalendarQuery } from '../../store/api';
import { addDaysIso, todayIso } from '../../lib/format';
import { cn } from '../../lib/cn';

const MAX_NIGHTS = 30;
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const monthStart = (iso) => `${iso.slice(0, 7)}-01`;
const shiftMonth = (iso, n) => {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
};
const monthLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const shortPrice = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`);

/**
 * Pick check-in and check-out on a month grid. Each night shows its price;
 * sold-out nights can't be stayed (but can be the check-out morning).
 */
export default function StayCalendar({ roomId, checkIn, checkOut, onChange }) {
  const today = todayIso();
  const { data, isFetching } = useGetRoomCalendarQuery(roomId);
  const [month, setMonth] = useState(() => monthStart(checkIn || today));

  const nights = useMemo(() => new Map((data?.days || []).map((d) => [d.date, d])), [data]);
  const lastDay = data?.days.at(-1)?.date;
  const basePrice = data?.basePrice;
  const isFree = (iso) => (nights.get(iso)?.unitsLeft ?? 0) > 0;

  // While choosing check-out: the latest allowed morning (first sold-out night, or the stay limit).
  const checkoutLimit = useMemo(() => {
    if (!checkIn || checkOut) return null;
    let d = checkIn;
    for (let i = 0; i < MAX_NIGHTS; i += 1) {
      if (!isFree(d)) return d;
      d = addDaysIso(d, 1);
    }
    return d;
    // isFree reads `nights`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, nights]);

  const choosingCheckout = Boolean(checkIn && !checkOut);

  function pick(iso) {
    if (choosingCheckout && iso > checkIn && iso <= checkoutLimit) {
      onChange({ checkIn, checkOut: iso });
      return;
    }
    if (isFree(iso)) onChange({ checkIn: iso, checkOut: '' });
  }

  const cells = useMemo(() => {
    const first = new Date(`${month}T12:00:00`);
    const lead = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => addDaysIso(month, i))];
  }, [month]);

  const canPrev = month > monthStart(today);
  const canNext = lastDay ? shiftMonth(month, 1) <= lastDay : false;

  return (
    <div className={cn('select-none transition-opacity', isFetching && !data && 'opacity-60')}>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))} disabled={!canPrev} className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface-2 disabled:opacity-25" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-ink">{monthLabel(month)}</p>
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))} disabled={!canNext} className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface-2 disabled:opacity-25" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted">
        {WEEKDAYS.map((d) => <span key={d} className="pb-1.5">{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label={monthLabel(month)}>
        {cells.map((iso, i) => {
          if (!iso) return <span key={`pad-${i}`} />;
          const night = nights.get(iso);
          const past = iso < today;
          const soldOut = !past && night && night.unitsLeft === 0;
          const outOfRange = !night && !past;
          const start = iso === checkIn;
          const end = iso === checkOut;
          const inside = checkIn && checkOut && iso > checkIn && iso < checkOut;
          const checkoutOption = choosingCheckout && iso > checkIn && iso <= checkoutLimit;
          const selectable = !past && !outOfRange && (checkoutOption || isFree(iso));
          const pricier = night && basePrice && night.price > basePrice;

          return (
            <div key={iso} className={cn('relative', (inside || (start && checkOut)) && 'bg-brand-soft', start && checkOut && 'rounded-l-full', end && 'rounded-r-full bg-brand-soft')}>
              <button
                type="button"
                disabled={!selectable}
                onClick={() => pick(iso)}
                aria-pressed={start || end}
                aria-label={`${new Date(`${iso}T12:00:00`).toDateString()}${soldOut ? ', sold out' : night ? `, ${shortPrice(night.price)} a night` : ''}`}
                title={night && night.label !== 'Standard' ? `${night.label} rate` : undefined}
                className={cn(
                  'mx-auto flex h-12 w-full max-w-12 flex-col items-center justify-center rounded-full text-sm transition-colors',
                  start || end ? 'bg-brand font-semibold text-white' : selectable ? 'text-ink hover:bg-surface-2' : 'text-muted/50',
                  soldOut && !checkoutOption && 'line-through decoration-muted/50'
                )}
              >
                <span className="leading-none">{Number(iso.slice(8))}</span>
                {!past && night && (
                  <span
                    className={cn(
                      'mt-1 text-[10px] leading-none no-underline',
                      start || end ? 'text-white/80' : soldOut ? 'text-muted/50' : pricier ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-muted'
                    )}
                  >
                    {soldOut ? 'Full' : shortPrice(night.price)}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span>Prices are per night</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Weekend or season rate</span>
        {(checkIn || checkOut) && (
          <button type="button" onClick={() => onChange({ checkIn: '', checkOut: '' })} className="ml-auto font-semibold text-ink underline underline-offset-2">
            Clear dates
          </button>
        )}
      </div>
      {choosingCheckout && <p className="mt-2 text-xs font-medium text-brand">Now pick your check-out day</p>}
    </div>
  );
}
