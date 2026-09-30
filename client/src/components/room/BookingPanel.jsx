import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, CreditCard, Hotel, Minus, Plus, Tag, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useCreateBookingMutation, useGetConfigQuery, useGetQuoteQuery, errorMessage } from '../../store/api';
import { addDaysIso, dateRange, money, moneyRound, plural, todayIso } from '../../lib/format';
import { cn } from '../../lib/cn';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Input, Textarea } from '../ui/Field';
import { useToast } from '../ui/Toast';

function PriceLines({ quote }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-muted">
        <span>{money(quote.pricePerNight)} × {plural(quote.nights, 'night')}</span>
        <span className="text-ink">{money(quote.subtotal)}</span>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span>Promo {quote.promo?.code} (−{quote.percentOff}%)</span>
          <span>−{money(quote.discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-muted">
        <span>Taxes & fees ({Math.round(quote.taxRate * 100)}%)</span>
        <span className="text-ink">{money(quote.taxes)}</span>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
        <span>Total</span>
        <span>{money(quote.total)}</span>
      </div>
    </div>
  );
}

export default function BookingPanel({ room, mobileOpen, setMobileOpen }) {
  const [params] = useSearchParams();
  const initialIn = params.get('checkIn') && params.get('checkIn') >= todayIso() ? params.get('checkIn') : '';
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialIn ? params.get('checkOut') || '' : '');
  const [guests, setGuests] = useState(Math.min(Number(params.get('guests')) || 1, room.maxGuests));
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { user, isAuthed } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: config } = useGetConfigQuery();

  const ready = checkIn && checkOut && checkOut > checkIn;
  const q = useDebounce({ id: room.id, checkIn, checkOut, guests, promoCode: promo }, 250);
  const { data: quote, error: quoteError, isFetching } = useGetQuoteQuery(q, { skip: !(q.checkIn && q.checkOut && q.checkOut > q.checkIn) });

  const onCheckIn = (v) => {
    setCheckIn(v);
    if (v && (!checkOut || checkOut <= v)) setCheckOut(addDaysIso(v, 1));
  };

  const reserve = () => {
    if (!isAuthed) {
      const back = `/rooms/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
      toast.info('Sign in to finish your booking. We saved your dates.');
      navigate(`/login?next=${encodeURIComponent(back)}`);
      return;
    }
    setMobileOpen?.(false);
    setCheckoutOpen(true);
  };

  const promoError = quoteError && promo && errorMessage(quoteError).toLowerCase().includes('promo');
  const available = quote?.available;

  const panel = (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-ink">
          <span className="text-2xl font-semibold">{moneyRound(room.pricePerNight)}</span>
          <span className="text-muted"> / night</span>
        </p>
        {room.rating && <span className="text-sm text-muted">★ {room.rating} · {plural(room.reviewCount, 'review')}</span>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="grid grid-cols-2 divide-x divide-line">
          <label className="block px-4 py-3 focus-within:bg-surface-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Check in</span>
            <input type="date" min={todayIso()} value={checkIn} onChange={(e) => onCheckIn(e.target.value)} className="block w-full bg-transparent text-sm font-medium text-ink outline-none" />
          </label>
          <label className="block px-4 py-3 focus-within:bg-surface-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Check out</span>
            <input type="date" min={checkIn ? addDaysIso(checkIn, 1) : todayIso()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="block w-full bg-transparent text-sm font-medium text-ink outline-none" />
          </label>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Guests</span>
            <span className="text-sm font-medium text-ink">{plural(guests, 'guest')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink disabled:opacity-30" aria-label="Fewer guests"><Minus className="h-4 w-4" /></button>
            <button type="button" onClick={() => setGuests((g) => Math.min(room.maxGuests, g + 1))} disabled={guests >= room.maxGuests} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink disabled:opacity-30" aria-label="More guests"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPromo(promoInput.trim()); }}
        className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-3 py-1.5"
      >
        <Tag className="h-4 w-4 text-muted" />
        <input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Promo code" className="min-w-0 flex-1 bg-transparent py-1.5 text-sm uppercase text-ink outline-none placeholder:normal-case" />
        {promo && quote?.promo ? (
          <button type="button" onClick={() => { setPromo(''); setPromoInput(''); }} className="text-xs font-semibold text-muted hover:text-ink">Remove</button>
        ) : (
          <button className="text-sm font-semibold text-brand disabled:opacity-40" disabled={!promoInput}>Apply</button>
        )}
      </form>
      {promoError && <p className="-mt-2 text-xs text-rose-500">That code is invalid or expired.</p>}

      <AnimatePresence mode="wait">
        {ready && (
          <motion.div key="quote" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {quote && !promoError ? (
              <div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-50')}>
                {available ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {quote.unitsLeft <= 2 ? `Only ${quote.unitsLeft} left for your dates!` : 'Available for your dates'}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium text-rose-500"><AlertCircle className="h-4 w-4" /> Sold out for these dates</p>
                )}
                <PriceLines quote={quote} />
              </div>
            ) : quoteError && !promoError ? (
              <p className="text-sm text-rose-500">{errorMessage(quoteError)}</p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Checking availability…</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Button size="lg" className="w-full" onClick={reserve} disabled={!ready || !available || isFetching}>
        {!ready ? 'Select dates' : available === false ? 'Unavailable' : 'Reserve'}
      </Button>
      <p className="text-center text-xs text-muted">You won't be charged yet</p>
    </div>
  );

  return (
    <>
      <div className="hidden rounded-[28px] border border-line bg-surface p-6 shadow-card lg:block">{panel}</div>

      {/* Mobile sticky bar + sheet */}
      <div className="fixed inset-x-0 bottom-[62px] z-40 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-ink"><span className="font-semibold">{moneyRound(quote?.total && ready ? quote.total : room.pricePerNight)}</span> <span className="text-sm text-muted">{quote?.total && ready ? 'total' : '/ night'}</span></p>
            <p className="text-xs text-muted">{ready ? dateRange(checkIn, checkOut) : 'Add dates for prices'}</p>
          </div>
          <Button onClick={() => (ready && available ? reserve() : setMobileOpen(true))}>
            {ready && available ? 'Reserve' : 'Check availability'}
          </Button>
        </div>
      </div>
      <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} title="Your stay">
        {panel}
      </Modal>

      {quote && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          room={room}
          quote={quote}
          stay={{ checkIn, checkOut, guests, promoCode: promo }}
          user={user}
          stripeEnabled={config?.stripeEnabled}
        />
      )}
    </>
  );
}

function CheckoutModal({ open, onClose, room, quote, stay, user, stripeEnabled }) {
  const [method, setMethod] = useState(stripeEnabled ? 'stripe' : 'pay_at_hotel');
  const [form, setForm] = useState({ guestName: user?.name || '', guestEmail: user?.email || '', guestPhone: user?.phone || '', specialRequests: '' });
  const [createBooking, { isLoading }] = useCreateBookingMutation();
  const navigate = useNavigate();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await createBooking({ roomId: room.id, ...stay, paymentMethod: method, ...form }).unwrap();
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      onClose();
      toast.success(`Booked! Reference ${res.booking.reference}`);
      navigate(`/my-bookings?new=${res.booking.id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const methods = [
    { id: 'stripe', icon: CreditCard, title: 'Pay now by card', text: 'Secure checkout with Stripe', disabled: !stripeEnabled },
    { id: 'pay_at_hotel', icon: Hotel, title: 'Pay at the hotel', text: 'Reserve now, pay on arrival' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Confirm and book" size="lg">
      <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
            <Input label="Email" type="email" required value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
          </div>
          <Input label="Phone (optional)" type="tel" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} placeholder="For check-in updates" />
          <Textarea label="Special requests (optional)" value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} placeholder="Early check-in, extra pillows, dietary needs…" className="[&_textarea]:min-h-20" />
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Payment</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {methods.map(({ id, icon: Icon, title, text, disabled }) => (
                <button
                  type="button"
                  key={id}
                  disabled={disabled}
                  onClick={() => setMethod(id)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45',
                    method === id ? 'border-brand bg-brand-soft ring-2 ring-[var(--ring)]' : 'border-line hover:border-ink/30'
                  )}
                >
                  <Icon className={cn('mt-0.5 h-5 w-5', method === id ? 'text-brand' : 'text-muted')} />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{title}</span>
                    <span className="block text-xs text-muted">{disabled ? 'Not available right now' : text}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl bg-surface-2 p-4 md:self-start">
          <div>
            <p className="font-semibold text-ink">{room.roomType}</p>
            <p className="text-sm text-muted">{room.hotel.name}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink">
            <CalendarDays className="h-4 w-4 text-muted" /> {dateRange(stay.checkIn, stay.checkOut)} · {plural(stay.guests, 'guest')}
          </div>
          <PriceLines quote={quote} />
          <Button type="submit" size="lg" loading={isLoading} className="w-full">
            {method === 'stripe' ? `Pay ${money(quote.total)}` : 'Confirm booking'}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5" /> Free cancellation before check-in</p>
        </div>
      </form>
    </Modal>
  );
}
