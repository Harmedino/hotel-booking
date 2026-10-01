import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, Users, MapPin, Luggage, Printer, CreditCard, XCircle, Star, Receipt } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/Badge';
import Badge from '../components/ui/Badge';
import { EmptyState } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { useCancelBookingMutation, useGetConfigQuery, useMyBookingsQuery, usePayBookingMutation, errorMessage } from '../store/api';
import { imageUrl } from '../lib/config';
import { dateRange, longDate, money, nightsBetween, plural, todayIso } from '../lib/format';
import { cn } from '../lib/cn';

const TABS = [
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['cancelled', 'Cancelled'],
];

function bucket(b) {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'completed' || b.checkOut < todayIso()) return 'past';
  return 'upcoming';
}

function Countdown({ checkIn }) {
  const days = nightsBetween(todayIso(), checkIn);
  if (days < 0) return null;
  return <Badge tone="brand">{days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}</Badge>;
}

function Receipt_({ b }) {
  return (
    <div className="space-y-5 text-sm">
      <div className="flex items-center justify-between rounded-2xl bg-surface-2 p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Reference</p>
          <p className="font-mono text-lg font-semibold text-ink">{b.reference}</p>
        </div>
        <StatusBadge status={b.status} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-muted">Check in</p><p className="font-medium text-ink">{longDate(b.checkIn)}</p></div>
        <div><p className="text-muted">Check out</p><p className="font-medium text-ink">{longDate(b.checkOut)}</p></div>
        <div><p className="text-muted">Guest</p><p className="font-medium text-ink">{b.guestName}</p></div>
        <div><p className="text-muted">Guests</p><p className="font-medium text-ink">{b.guests}</p></div>
      </div>
      <div>
        <p className="font-semibold text-ink">{b.hotel.name}</p>
        <p className="text-muted">{b.room.roomType} · {b.hotel.address}, {b.hotel.city}</p>
        {b.hotel.contact && <p className="text-muted">{b.hotel.contact}</p>}
      </div>
      <div className="space-y-2 border-t border-line pt-4">
        {(b.priceLines?.length ? b.priceLines : [{ label: 'Standard', price: b.pricePerNight, nights: b.nights }]).map((l) => (
          <div key={`${l.label}-${l.price}`} className="flex justify-between">
            <span className="text-muted">{money(l.price)} × {plural(l.nights, 'night')}{l.label !== 'Standard' ? ` · ${l.label}` : ''}</span>
            <span className="text-ink">{money(l.price * l.nights)}</span>
          </div>
        ))}
        {b.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Promo {b.promoCode}</span><span>−{money(b.discount)}</span></div>}
        <div className="flex justify-between"><span className="text-muted">Taxes & fees</span><span className="text-ink">{money(b.taxes)}</span></div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink"><span>Total</span><span>{money(b.totalPrice)}</span></div>
        <p className="text-xs text-muted">
          {b.isRefunded ? 'Refunded to your card' : b.isPaid ? `Paid ${b.paymentMethod === 'stripe' ? 'by card' : 'at hotel'}` : 'Pay at the hotel on arrival'}
        </p>
      </div>
      {b.specialRequests && <div className="rounded-2xl bg-surface-2 p-4"><p className="text-muted">Special requests</p><p className="text-ink">{b.specialRequests}</p></div>}
    </div>
  );
}

function BookingCard({ b, highlight, onView, onCancel, onPay, stripeEnabled, paying }) {
  const canCancel = ['pending', 'confirmed'].includes(b.status) && b.checkIn > todayIso();
  const needsPay = b.status === 'pending' && !b.isPaid && stripeEnabled;
  const canReview = !b.hasReview && b.status !== 'cancelled' && (b.status === 'completed' || b.checkOut <= todayIso());

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn('overflow-hidden rounded-[28px] border bg-surface shadow-card transition', highlight ? 'border-brand ring-4 ring-[var(--ring)]' : 'border-line')}
    >
      <div className="flex flex-col sm:flex-row">
        <Link to={`/rooms/${b.roomId}`} className="relative block h-44 shrink-0 sm:h-auto sm:w-56">
          <img src={imageUrl(b.room.images?.[0])} alt="" className="h-full w-full object-cover" loading="lazy" />
          {bucket(b) === 'upcoming' && <div className="absolute left-3 top-3"><Countdown checkIn={b.checkIn} /></div>}
        </Link>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-ink">{b.hotel.name}</h3>
              <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" /> {b.hotel.city} · {b.room.roomType}</p>
            </div>
            <StatusBadge status={b.status} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-muted" /> {dateRange(b.checkIn, b.checkOut)} · {plural(b.nights, 'night')}</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-muted" /> {plural(b.guests, 'guest')}</span>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">{money(b.totalPrice)}</p>
              <p className="text-xs text-muted">{b.isRefunded ? 'Refunded' : b.isPaid ? 'Paid' : b.paymentMethod === 'stripe' ? 'Payment pending' : 'Pay at hotel'} · {b.reference}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {needsPay && <Button size="sm" loading={paying} onClick={() => onPay(b)}><CreditCard className="h-4 w-4" /> Pay now</Button>}
              {canReview && <Button size="sm" variant="soft" to={`/rooms/${b.roomId}#reviews`}><Star className="h-4 w-4" /> Review</Button>}
              <Button size="sm" variant="secondary" onClick={() => onView(b)}><Receipt className="h-4 w-4" /> Details</Button>
              {canCancel && <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => onCancel(b)}><XCircle className="h-4 w-4" /> Cancel</Button>}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function MyBookings() {
  const { data = [], isLoading } = useMyBookingsQuery();
  const { data: config } = useGetConfigQuery();
  const [cancel, { isLoading: cancelling }] = useCancelBookingMutation();
  const [pay, { isLoading: paying }] = usePayBookingMutation();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('upcoming');
  const [viewing, setViewing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const toast = useToast();
  const newId = params.get('new');

  useEffect(() => {
    if (params.get('payment') === 'cancelled') toast.info('Payment cancelled. You can pay again from your trip.');
  }, [params, toast]);

  const groups = useMemo(() => {
    const g = { upcoming: [], past: [], cancelled: [] };
    data.forEach((b) => g[bucket(b)].push(b));
    g.upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    return g;
  }, [data]);

  const doCancel = async () => {
    try {
      const res = await cancel(confirming.id).unwrap();
      toast.success(res.isRefunded ? 'Booking cancelled. Your refund is on its way.' : 'Booking cancelled.');
      setConfirming(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doPay = async (b) => {
    try {
      const { checkoutUrl } = await pay(b.id).unwrap();
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const list = groups[tab];

  return (
    <PageShell title="My trips" description="Everything you've booked, in one place.">
      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={cn('relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition', tab === id ? 'text-bg' : 'text-muted hover:text-ink')}>
            {tab === id && <motion.span layoutId="trip-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative">{label} {!isLoading && <span className="opacity-60">{groups[id].length}</span>}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-[28px]" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title={tab === 'upcoming' ? 'No trips booked… yet' : tab === 'past' ? 'No past trips' : 'No cancelled bookings'}
          description={tab === 'upcoming' ? 'Time to dust off your bags and start planning your next adventure.' : undefined}
          action={tab === 'upcoming' && <Button to="/rooms">Start exploring</Button>}
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {list.map((b) => (
              <BookingCard key={b.id} b={b} highlight={b.id === newId} onView={setViewing} onCancel={setConfirming} onPay={doPay} paying={paying} stripeEnabled={config?.stripeEnabled} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Booking details"
        footer={viewing && <Button to={`/bookings/${viewing.id}/receipt`} variant="secondary" className="w-full"><Printer className="h-4 w-4" /> Printable receipt</Button>}
      >
        {viewing && <Receipt_ b={viewing} />}
      </Modal>

      <ConfirmModal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={doCancel}
        loading={cancelling}
        title="Cancel this booking?"
        description={confirming ? `${confirming.hotel.name}, ${dateRange(confirming.checkIn, confirming.checkOut)}. ${confirming.isPaid ? 'You will get a full refund to your card.' : 'You have not been charged.'}` : ''}
        confirmLabel="Yes, cancel"
      />
    </PageShell>
  );
}
