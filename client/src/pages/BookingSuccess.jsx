import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { useVerifyPaymentQuery, errorMessage } from '../store/api';
import { dateRange, money } from '../lib/format';

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { data: b, isLoading, error } = useVerifyPaymentQuery(sessionId, { skip: !sessionId });

  return (
    <PageShell className="max-w-xl">
      {isLoading ? (
        <Skeleton className="h-80 rounded-[28px]" />
      ) : error || !sessionId ? (
        <div className="rounded-[28px] border border-line bg-surface p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-semibold text-ink">We couldn't confirm your payment</h1>
          <p className="mt-2 text-muted">{errorMessage(error, 'Missing payment session.')} If you were charged, your trip will update shortly.</p>
          <Button to="/my-bookings" className="mt-6">Go to my trips</Button>
        </div>
      ) : (
        <div className="rounded-[28px] border border-line bg-surface p-8 text-center shadow-card">
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          </motion.div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink">You're going to {b.hotel.city}!</h1>
          <p className="mt-2 text-muted">Payment received. A confirmation is on its way to {b.guestEmail}.</p>
          <div className="mt-6 space-y-1 rounded-2xl bg-surface-2 p-4 text-sm">
            <p className="font-semibold text-ink">{b.hotel.name} · {b.room.roomType}</p>
            <p className="text-muted">{dateRange(b.checkIn, b.checkOut)} · {money(b.totalPrice)}</p>
            <p className="font-mono text-ink">{b.reference}</p>
          </div>
          <Button to={`/my-bookings?new=${b.id}`} className="mt-6">View my trip</Button>
        </div>
      )}
    </PageShell>
  );
}
