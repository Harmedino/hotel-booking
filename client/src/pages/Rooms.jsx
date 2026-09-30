import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import SearchBar from '../components/SearchBar';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { EmptyState } from '../components/ui/misc';
import { amenityIcon } from '../components/amenities';
import { useGetFiltersQuery, useGetRoomsQuery, errorMessage } from '../store/api';
import { dateRange, nightsBetween, plural } from '../lib/format';
import { cn } from '../lib/cn';

const SORTS = [
  ['recommended', 'Recommended'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating', 'Top rated'],
  ['newest', 'Newest'],
];

const chip = (active) =>
  cn(
    'rounded-full border px-3.5 py-2 text-sm font-medium transition',
    active ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink hover:border-ink/30'
  );

function FilterPanel({ values, onChange, filters }) {
  const [min, setMin] = useState(values.minPrice || '');
  const [max, setMax] = useState(values.maxPrice || '');
  const amenities = values.amenities ? values.amenities.split(',') : [];

  const toggleAmenity = (a) => {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    onChange({ amenities: next.join(',') });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 font-semibold text-ink">Price per night</h3>
        <div className="flex items-center gap-2">
          {[['Min', min, setMin, 'minPrice'], ['Max', max, setMax, 'maxPrice']].map(([label, val, set, key]) => (
            <label key={key} className="flex-1 rounded-2xl border border-line bg-surface px-3 py-2 focus-within:border-brand">
              <span className="block text-[11px] font-semibold uppercase text-muted">{label}</span>
              <span className="flex items-center text-sm text-ink">
                $
                <input
                  type="number"
                  min={0}
                  value={val}
                  placeholder={String(key === 'minPrice' ? filters?.priceRange.min ?? 0 : filters?.priceRange.max ?? '')}
                  onChange={(e) => set(e.target.value)}
                  onBlur={() => onChange({ [key]: val })}
                  onKeyDown={(e) => e.key === 'Enter' && onChange({ [key]: val })}
                  className="w-full bg-transparent pl-1 outline-none"
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-ink">Room type</h3>
        <div className="flex flex-wrap gap-2">
          <button className={chip(!values.roomType)} onClick={() => onChange({ roomType: '' })}>Any</button>
          {filters?.roomTypes.map((t) => (
            <button key={t} className={chip(values.roomType === t)} onClick={() => onChange({ roomType: values.roomType === t ? '' : t })}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-ink">Amenities</h3>
        <div className="space-y-1">
          {filters?.amenities.map((a) => {
            const Icon = amenityIcon(a);
            const on = amenities.includes(a);
            return (
              <label key={a} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <input type="checkbox" checked={on} onChange={() => toggleAmenity(a)} className="h-4 w-4 accent-[var(--brand)]" />
                <Icon className="h-4 w-4 text-muted" />
                <span className="text-sm text-ink">{a}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const values = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const page = Number(values.page) || 1;

  const { data: filters } = useGetFiltersQuery();
  const { data, isFetching, isLoading, error } = useGetRoomsQuery({ ...values, limit: 12, page });

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const activeCount = ['minPrice', 'maxPrice', 'roomType', 'amenities'].filter((k) => values[k]).length;
  const clearFilters = () => update({ minPrice: '', maxPrice: '', roomType: '', amenities: '' });

  // Carry dates/guests to the room page so the booking widget is prefilled.
  const carry = new URLSearchParams(Object.entries({ checkIn: values.checkIn, checkOut: values.checkOut, guests: values.guests }).filter(([, v]) => v));
  const carryStr = carry.toString() ? `?${carry}` : '';

  const nights = nightsBetween(values.checkIn, values.checkOut);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 md:pb-20 md:pt-28 lg:px-8">
      <SearchBar
        key={`${values.destination}|${values.checkIn}|${values.checkOut}|${values.guests}`}
        initial={values}
        onSearch={(v) => update(v)}
      />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
            {values.destination ? `Stays in ${values.destination}` : 'All stays'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isLoading ? 'Searching…' : `${plural(data?.total || 0, 'room')} available`}
            {nights > 0 && ` · ${dateRange(values.checkIn, values.checkOut)} · ${plural(nights, 'night')}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] text-white">{activeCount}</span>}
          </button>
          <select
            value={values.sort || 'recommended'}
            onChange={(e) => update({ sort: e.target.value === 'recommended' ? '' : e.target.value })}
            className="h-11 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink outline-none"
            aria-label="Sort by"
          >
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.roomType && <FilterTag onClear={() => update({ roomType: '' })}>{values.roomType}</FilterTag>}
          {(values.minPrice || values.maxPrice) && (
            <FilterTag onClear={() => update({ minPrice: '', maxPrice: '' })}>${values.minPrice || 0} – {values.maxPrice ? `$${values.maxPrice}` : 'any'}</FilterTag>
          )}
          {values.amenities?.split(',').map((a) => (
            <FilterTag key={a} onClear={() => update({ amenities: values.amenities.split(',').filter((x) => x !== a).join(',') })}>{a}</FilterTag>
          ))}
          <button onClick={clearFilters} className="text-sm font-medium text-brand underline-offset-4 hover:underline">Clear all</button>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[28px] border border-line bg-surface p-6">
            <FilterPanel key={`${values.minPrice}|${values.maxPrice}`} values={values} onChange={update} filters={filters} />
          </div>
        </aside>

        <div>
          {error ? (
            <EmptyState icon={SearchX} title="We hit a snag" description={errorMessage(error)} action={<Button onClick={() => update({ checkIn: '', checkOut: '' })}>Reset dates</Button>} />
          ) : isLoading ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <RoomCardSkeleton key={i} />)}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No stays match your search"
              description="Try different dates, a nearby city, or fewer filters."
              action={<Button variant="secondary" onClick={() => setParams({})}>Clear search</Button>}
            />
          ) : (
            <>
              <motion.div className={cn('grid gap-x-6 gap-y-10 transition-opacity sm:grid-cols-2 xl:grid-cols-3', isFetching && 'opacity-60')}>
                {data.items.map((room, i) => <RoomCard key={room.id} room={room} index={i} search={carryStr} />)}
              </motion.div>
              {data.pages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <Button variant="secondary" size="icon" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} aria-label="Previous page">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: data.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => update({ page: String(i + 1) })}
                      className={cn('h-10 w-10 rounded-full text-sm font-semibold transition', page === i + 1 ? 'bg-ink text-bg' : 'text-ink hover:bg-surface-2')}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <Button variant="secondary" size="icon" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })} aria-label="Next page">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="flex items-center justify-between">
            <button onClick={clearFilters} className="text-sm font-semibold text-ink underline">Clear all</button>
            <Button onClick={() => setFiltersOpen(false)}>Show {plural(data?.total || 0, 'stay')}</Button>
          </div>
        }
      >
        <FilterPanel key={`${values.minPrice}|${values.maxPrice}`} values={values} onChange={update} filters={filters} />
      </Modal>
    </div>
  );
}

function FilterTag({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1.5 pl-3 pr-1.5 text-sm font-medium text-brand">
      {children}
      <button onClick={onClear} className="rounded-full p-0.5 hover:bg-brand/15" aria-label="Remove filter"><X className="h-3.5 w-3.5" /></button>
    </span>
  );
}
