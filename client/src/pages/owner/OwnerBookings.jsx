import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, CalendarRange, MoreHorizontal, Check, LogIn, Flag, XCircle, Banknote, Mail, Phone } from 'lucide-react';
import { OwnerHeader } from './OwnerLayout';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/misc';
import { useToast } from '../../components/ui/Toast';
import { useOwnerBookingsQuery, useOwnerHotelsQuery, useUpdateOwnerBookingMutation, errorMessage } from '../../store/api';
import { useDebounce } from '../../hooks/useDebounce';
import { dateRange, longDate, money, plural, relativeTime, todayIso } from '../../lib/format';
import { cn } from '../../lib/cn';

const TABS = [['', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['checked_in', 'In house'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];

function actionsFor(b) {
  const a = [];
  if (b.status === 'pending') a.push(['confirmed', 'Confirm', Check]);
  if (b.status === 'confirmed' && b.checkIn <= todayIso()) a.push(['checked_in', 'Check in', LogIn]);
  if (['confirmed', 'checked_in'].includes(b.status)) a.push(['completed', 'Check out', Flag]);
  if (['pending', 'confirmed'].includes(b.status)) a.push(['cancelled', 'Cancel', XCircle]);
  return a;
}

export default function OwnerBookings() {
  const [status, setStatus] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const search = useDebounce(q);
  const { data: hotels = [] } = useOwnerHotelsQuery();
  const { data, isLoading, isFetching } = useOwnerBookingsQuery({ status, hotelId, q: search, page, limit: 15 });
  const [update, { isLoading: updating }] = useUpdateOwnerBookingMutation();
  const toast = useToast();

  const act = async (b, body, msg) => {
    try {
      const res = await update({ id: b.id, ...body }).unwrap();
      setSelected((s) => (s?.id === b.id ? { ...s, ...res } : s));
      toast.success(msg);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const labels = { confirmed: 'Booking confirmed', checked_in: 'Guest checked in', completed: 'Guest checked out', cancelled: 'Booking cancelled' };

  return (
    <>
      <OwnerHeader title="Bookings" description="Manage arrivals, payments and guest stays." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search guest, email or reference" className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink outline-none focus:border-brand" />
        </div>
        {hotels.length > 1 && (
          <select value={hotelId} onChange={(e) => { setHotelId(e.target.value); setPage(1); }} className="h-11 rounded-full border border-line bg-surface px-4 text-sm text-ink outline-none">
            <option value="">All properties</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
      </div>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map(([v, l]) => (
          <button key={l} onClick={() => { setStatus(v); setPage(1); }} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition', status === v ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:text-ink')}>{l}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !data.items.length ? (
        <EmptyState icon={CalendarRange} title="No bookings found" description={q || status ? 'Try a different filter or search.' : 'New bookings will appear here the moment guests book.'} />
      ) : (
        <div className={cn('overflow-hidden rounded-[24px] border border-line bg-surface transition-opacity', isFetching && 'opacity-60')}>
          <div className="hidden grid-cols-[1.4fr_1.4fr_1fr_0.9fr_0.8fr_44px] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:grid">
            <span>Guest</span><span>Stay</span><span>Room</span><span>Total</span><span>Status</span><span />
          </div>
          <ul className="divide-y divide-line">
            {data.items.map((b, i) => (
              <motion.li key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <button onClick={() => setSelected(b)} className="grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-4 text-left transition hover:bg-surface-2 md:grid-cols-[1.4fr_1.4fr_1fr_0.9fr_0.8fr_44px] md:items-center">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{b.guestName}</span>
                    <span className="block truncate font-mono text-xs text-muted">{b.reference}</span>
                  </span>
                  <span className="text-sm text-ink md:order-none">
                    {dateRange(b.checkIn, b.checkOut)}<span className="block text-xs text-muted">{plural(b.nights, 'night')} · {plural(b.guests, 'guest')}</span>
                  </span>
                  <span className="hidden truncate text-sm text-ink md:block">{b.room.roomType}<span className="block truncate text-xs text-muted">{b.hotel.name}</span></span>
                  <span className="text-sm font-semibold text-ink">{money(b.totalPrice)}<span className={cn('block text-xs font-normal', b.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted')}>{b.isRefunded ? 'Refunded' : b.isPaid ? 'Paid' : 'Unpaid'}</span></span>
                  <span><StatusBadge status={b.status} /></span>
                  <span className="hidden justify-end text-muted md:flex"><MoreHorizontal className="h-5 w-5" /></span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-muted">
          <span>Page {page} of {data.pages} · {data.total} bookings</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.guestName} description={selected && `${selected.reference} · booked ${relativeTime(selected.createdAt)}`}>
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={selected.status} /><span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', selected.isPaid ? 'bg-emerald-500/12 text-emerald-600' : 'bg-surface-2 text-muted')}>{selected.isRefunded ? 'Refunded' : selected.isPaid ? 'Paid' : 'Unpaid'} · {selected.paymentMethod === 'stripe' ? 'Card' : 'At hotel'}</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-muted">Check in</p><p className="font-medium text-ink">{longDate(selected.checkIn)}</p></div>
              <div><p className="text-muted">Check out</p><p className="font-medium text-ink">{longDate(selected.checkOut)}</p></div>
              <div><p className="text-muted">Room</p><p className="font-medium text-ink">{selected.room.roomType}</p></div>
              <div><p className="text-muted">Guests</p><p className="font-medium text-ink">{selected.guests}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${selected.guestEmail}`} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-ink hover:bg-surface-2"><Mail className="h-4 w-4" /> {selected.guestEmail}</a>
              {selected.guestPhone && <a href={`tel:${selected.guestPhone}`} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-ink hover:bg-surface-2"><Phone className="h-4 w-4" /> {selected.guestPhone}</a>}
            </div>
            {selected.specialRequests && <div className="rounded-2xl bg-surface-2 p-4"><p className="text-muted">Special requests</p><p className="text-ink">{selected.specialRequests}</p></div>}
            <div className="space-y-1 rounded-2xl border border-line p-4">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-ink">{money(selected.subtotal)}</span></div>
              {selected.discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount ({selected.promoCode})</span><span className="text-ink">−{money(selected.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Taxes</span><span className="text-ink">{money(selected.taxes)}</span></div>
              <div className="flex justify-between pt-1 font-semibold text-ink"><span>Total</span><span>{money(selected.totalPrice)}</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {actionsFor(selected).map(([s, label, Icon]) => (
                <Button key={s} size="sm" variant={s === 'cancelled' ? 'ghost' : 'primary'} className={s === 'cancelled' ? 'text-rose-500' : ''} loading={updating} onClick={() => act(selected, { status: s }, labels[s])}>
                  <Icon className="h-4 w-4" /> {label}
                </Button>
              ))}
              {selected.paymentMethod === 'pay_at_hotel' && selected.status !== 'cancelled' && (
                <Button size="sm" variant="secondary" loading={updating} onClick={() => act(selected, { isPaid: !selected.isPaid }, selected.isPaid ? 'Marked unpaid' : 'Payment recorded')}>
                  <Banknote className="h-4 w-4" /> {selected.isPaid ? 'Mark unpaid' : 'Mark as paid'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
