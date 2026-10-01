import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { assets } from '../assets/assets';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/Badge';
import { useGetBookingQuery, errorMessage } from '../store/api';
import { longDate, money, plural } from '../lib/format';

function Row({ label, value, strong, tone }) {
  return (
    <div className={`flex justify-between gap-4 py-1.5 ${strong ? 'text-base font-semibold text-ink' : 'text-sm'}`}>
      <span className={strong ? '' : 'text-muted'}>{label}</span>
      <span className={tone || 'text-ink'}>{value}</span>
    </div>
  );
}

/** /bookings/:id/receipt: a clean page to print or save as PDF. */
export default function Receipt() {
  const { id } = useParams();
  const { data: b, isLoading, error } = useGetBookingQuery(id);

  useEffect(() => {
    if (b) document.title = `Receipt ${b.reference} · QuickStay`;
  }, [b]);

  if (isLoading) {
    return <div className="mx-auto max-w-2xl px-4 pb-16 pt-28"><Skeleton className="h-[560px] rounded-[28px]" /></div>;
  }
  if (error || !b) {
    return (
      <div className="mx-auto max-w-md px-4 pb-16 pt-32 text-center">
        <p className="text-ink">{errorMessage(error, 'We could not find that booking.')}</p>
        <Button to="/my-bookings" variant="secondary" className="mt-4">Back to my trips</Button>
      </div>
    );
  }

  const lines = b.priceLines?.length ? b.priceLines : [{ label: 'Standard', price: b.pricePerNight, nights: b.nights }];
  const payment = b.isRefunded
    ? 'Refunded to your card'
    : b.isPaid
      ? `Paid ${b.paymentMethod === 'stripe' ? 'online by card' : 'at the hotel'}`
      : b.status === 'cancelled'
        ? 'Not charged'
        : 'Due at the hotel on arrival';

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-24 sm:pt-28 print:max-w-none print:p-0">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <Link to="/my-bookings" className="flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> My trips</Link>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print or save PDF</Button>
      </div>

      <article className="rounded-[28px] border border-line bg-surface p-6 sm:p-10 print:rounded-none print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-4">
          <img src={assets.logo} alt="QuickStay" className="h-7 brightness-0 dark:brightness-100 print:brightness-0" />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Receipt</p>
            <p className="font-mono text-lg font-semibold text-ink">{b.reference}</p>
            <p className="text-xs text-muted">Booked {longDate(b.createdAt)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Stay at</p>
            <p className="mt-1 font-semibold text-ink">{b.hotel.name}</p>
            <p className="text-sm text-muted">{b.hotel.address}, {b.hotel.city}</p>
            {b.hotel.contact && <p className="text-sm text-muted">{b.hotel.contact}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Guest</p>
            <p className="mt-1 font-semibold text-ink">{b.guestName}</p>
            <p className="text-sm text-muted">{b.guestEmail}</p>
            {b.guestPhone && <p className="text-sm text-muted">{b.guestPhone}</p>}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-surface-2 p-4 sm:grid-cols-4 print:border print:border-line print:bg-transparent">
          <div><p className="text-xs text-muted">Check in</p><p className="text-sm font-semibold text-ink">{longDate(b.checkIn)}</p></div>
          <div><p className="text-xs text-muted">Check out</p><p className="text-sm font-semibold text-ink">{longDate(b.checkOut)}</p></div>
          <div><p className="text-xs text-muted">Room</p><p className="text-sm font-semibold text-ink">{b.room.roomType}</p></div>
          <div><p className="text-xs text-muted">Guests</p><p className="text-sm font-semibold text-ink">{b.guests}</p></div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-line pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <span>{plural(b.nights, 'night')}</span>
            <span>Amount</span>
          </div>
          <div className="py-2">
            {lines.map((l) => (
              <Row key={`${l.label}-${l.price}`} label={`${l.label === 'Standard' ? 'Room' : l.label} · ${money(l.price)} × ${plural(l.nights, 'night')}`} value={money(l.price * l.nights)} />
            ))}
            {b.discount > 0 && <Row label={`Promo ${b.promoCode}`} value={`−${money(b.discount)}`} tone="text-emerald-600" />}
            <Row label="Taxes & fees" value={money(b.taxes)} />
          </div>
          <div className="border-t border-line pt-2">
            <Row label="Total" value={money(b.totalPrice)} strong />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
          <div>
            <p className="text-xs text-muted">Payment</p>
            <p className="text-sm font-semibold text-ink">{payment}</p>
          </div>
          <StatusBadge status={b.status} />
        </div>

        {b.specialRequests && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Special requests</p>
            <p className="mt-1 text-sm text-ink">{b.specialRequests}</p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted">Thank you for booking with QuickStay. Show this reference at check-in.</p>
      </article>
    </div>
  );
}
