import { HeartHandshake, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { assets } from '../assets/assets';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Reveal } from '../components/ui/misc';
import { useGetStatsQuery } from '../store/api';
import { useCountUp } from '../hooks/useCountUp';

const VALUES = [
  [Zap, 'Fast by default', 'Search to confirmation in under two minutes, on any device.'],
  [ShieldCheck, 'Honest pricing', 'Taxes and fees shown before you book. No surprises at checkout.'],
  [HeartHandshake, 'Built with hosts', 'Tools that help independent hotels compete with the big chains.'],
  [Sparkles, 'Curated stays', 'Every property is reviewed by real guests after real stays.'],
];

function Stat({ value, label, decimals = 0, suffix = '' }) {
  const [ref, n] = useCountUp(value);
  return (
    <div ref={ref} className="rounded-[24px] border border-line bg-surface p-6">
      <p className="text-4xl font-semibold text-ink">{n.toFixed(decimals)}{suffix}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default function About() {
  const { data: stats, isLoading } = useGetStatsQuery();
  return (
    <PageShell>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">About QuickStay</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-6xl">Booking hotels should feel as good as staying in them.</h1>
          <p className="mt-5 text-lg text-muted">
            QuickStay connects travellers with great independent hotels, and gives those hotels the software to run bookings, payments and guest relationships without the spreadsheets.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/rooms">Find a stay</Button>
            <Button to="/list-property" variant="secondary">List your property</Button>
          </div>
        </div>
        <Reveal>
          <img src={assets.heroImage} alt="" className="aspect-[4/3] w-full rounded-[32px] object-cover" />
        </Reveal>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <Stat value={stats.hotels} label="Partner hotels" />
            <Stat value={stats.cities} label="Cities" />
            <Stat value={stats.bookings} label="Stays booked" suffix="+" />
            <Stat value={Number(stats.avgRating)} decimals={1} label="Average guest rating" suffix="★" />
          </>
        )}
      </div>

      <div className="mt-20">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">What we believe</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {VALUES.map(([Icon, title, text], i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="h-full rounded-[28px] border border-line bg-surface p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
