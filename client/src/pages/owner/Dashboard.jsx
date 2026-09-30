import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { DollarSign, CalendarCheck, Percent, BedDouble, TrendingUp, TrendingDown, ArrowRight, LogIn, Star, Plus } from 'lucide-react';
import { OwnerHeader } from './OwnerLayout';
import RevenueChart from './RevenueChart';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/misc';
import { useOwnerStatsQuery } from '../../store/api';
import { imageUrl } from '../../lib/config';
import { dateRange, money, moneyRound, relativeTime, shortDate } from '../../lib/format';
import { cn } from '../../lib/cn';

const RANGES = [[7, '7D'], [30, '30D'], [90, '90D'], [365, '1Y']];

function delta(cur, prev) {
  if (!prev) return cur ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

function Kpi({ icon: Icon, label, value, change, index }) {
  const up = change >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-[24px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
        {change !== undefined && (
          <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', up ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/12 text-rose-600 dark:text-rose-400')}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold text-ink sm:text-3xl">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isFetching } = useOwnerStatsQuery(days);

  const header = (
    <OwnerHeader
      title="Overview"
      description="How your properties are performing."
      action={
        <div className="flex rounded-full border border-line bg-surface p-1">
          {RANGES.map(([d, l]) => (
            <button key={d} onClick={() => setDays(d)} className={cn('relative rounded-full px-3.5 py-1.5 text-sm font-semibold transition', days === d ? 'text-bg' : 'text-muted hover:text-ink')}>
              {days === d && <motion.span layoutId="range" className="absolute inset-0 rounded-full bg-ink" />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
      }
    />
  );

  if (isLoading) {
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-[24px]" />)}</div>
        <Skeleton className="mt-6 h-80 rounded-[24px]" />
      </>
    );
  }

  if (data.totals.rooms === 0) {
    return (
      <>
        {header}
        <EmptyState icon={BedDouble} title="Add your first room" description="Once your rooms are listed, bookings and revenue will show up here." action={<Button to="/owner/rooms/new"><Plus className="h-4 w-4" /> Add a room</Button>} />
      </>
    );
  }

  const { current: c, previous: p } = data;
  const kpis = [
    { icon: DollarSign, label: 'Revenue', value: moneyRound(c.revenue), change: delta(c.revenue, p.revenue) },
    { icon: CalendarCheck, label: 'Bookings', value: c.bookings, change: delta(c.bookings, p.bookings) },
    { icon: Percent, label: 'Occupancy', value: `${c.occupancy}%`, change: delta(c.occupancy, p.occupancy) },
    { icon: BedDouble, label: 'Avg. nightly rate', value: moneyRound(c.adr), change: delta(c.adr, p.adr) },
  ];

  return (
    <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
      {header}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => <Kpi key={k.label} {...k} index={i} />)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[24px] border border-line bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-sm text-muted">Revenue, last {days} days</p>
              <p className="text-2xl font-semibold text-ink">{money(c.revenue)}</p>
            </div>
            <p className="text-sm text-muted">Collected <span className="font-semibold text-ink">{money(c.collected)}</span> · {c.cancellations} cancelled</p>
          </div>
          <RevenueChart series={data.series} />
        </div>

        <div className="rounded-[24px] border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Arriving this week</h2>
            <LogIn className="h-4 w-4 text-muted" />
          </div>
          {data.upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No arrivals in the next 7 days.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.upcoming.map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-2 text-ink">
                    <span className="text-[10px] uppercase text-muted">{shortDate(b.checkIn).split(' ')[0]}</span>
                    <span className="text-sm font-bold leading-none">{shortDate(b.checkIn).split(' ')[1]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{b.guestName}</p>
                    <p className="truncate text-xs text-muted">{b.room.roomType} · {b.nights}n · {b.hotel.name}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Top rooms</h2>
            {data.totals.rating && <span className="flex items-center gap-1 text-sm text-muted"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {data.totals.rating} avg</span>}
          </div>
          <ul className="mt-4 space-y-3">
            {data.topRooms.map((r) => {
              const pct = data.topRooms[0].revenue ? (r.revenue / data.topRooms[0].revenue) * 100 : 0;
              return (
                <li key={r.id} className="flex items-center gap-3">
                  <img src={imageUrl(r.image)} alt="" className="h-11 w-11 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-ink">{r.roomType} · {r.hotelName}</span>
                      <span className="shrink-0 font-semibold text-ink">{moneyRound(r.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-brand" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-[24px] border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Latest bookings</h2>
            <Link to="/owner/bookings" className="flex items-center gap-1 text-sm font-semibold text-brand">All <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {data.recent.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{b.guestName}</p>
                  <p className="truncate text-xs text-muted">{dateRange(b.checkIn, b.checkOut)} · {relativeTime(b.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-ink">{money(b.totalPrice)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
