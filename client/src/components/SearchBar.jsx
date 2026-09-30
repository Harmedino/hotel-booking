import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, CalendarDays, Users, Search } from 'lucide-react';
import { useGetCitiesQuery } from '../store/api';
import { todayIso, addDaysIso } from '../lib/format';
import { cn } from '../lib/cn';

const cell = 'flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-2.5 transition hover:bg-surface-2 focus-within:bg-surface-2';
const label = 'block text-[11px] font-semibold uppercase tracking-wider text-muted';
const field = 'w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted/70';

export default function SearchBar({ initial = {}, onSearch, className }) {
  const navigate = useNavigate();
  const { data: cities = [] } = useGetCitiesQuery();
  const [destination, setDestination] = useState(initial.destination || '');
  const [checkIn, setCheckIn] = useState(initial.checkIn || '');
  const [checkOut, setCheckOut] = useState(initial.checkOut || '');
  const [guests, setGuests] = useState(initial.guests || '');

  const submit = (e) => {
    e.preventDefault();
    const values = { destination: destination.trim(), checkIn, checkOut: checkIn ? checkOut : '', guests };
    if (onSearch) return onSearch(values);
    const params = new URLSearchParams(Object.entries(values).filter(([, v]) => v));
    navigate(`/rooms?${params}`);
  };

  const onCheckIn = (v) => {
    setCheckIn(v);
    if (v && (!checkOut || checkOut <= v)) setCheckOut(addDaysIso(v, 1));
  };

  return (
    <motion.form
      onSubmit={submit}
      className={cn(
        'flex flex-col gap-1 rounded-[28px] border border-line bg-surface p-2 shadow-card md:flex-row md:items-center',
        className
      )}
    >
      <div className={cell}>
        <MapPin className="h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <label htmlFor="sb-dest" className={label}>Where</label>
          <input id="sb-dest" list="sb-cities" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City or hotel" className={field} />
          <datalist id="sb-cities">
            {cities.map((c) => <option key={c.city} value={c.city}>{c.country}</option>)}
          </datalist>
        </div>
      </div>
      <div className="hidden h-8 w-px bg-line md:block" />
      <div className="grid grid-cols-2 gap-1 md:contents">
        <div className={cell}>
          <CalendarDays className="hidden h-5 w-5 shrink-0 text-brand sm:block" />
          <div className="min-w-0 flex-1">
            <label htmlFor="sb-in" className={label}>Check in</label>
            <input id="sb-in" type="date" min={todayIso()} value={checkIn} onChange={(e) => onCheckIn(e.target.value)} className={field} />
          </div>
        </div>
        <div className="hidden h-8 w-px bg-line md:block" />
        <div className={cell}>
          <CalendarDays className="hidden h-5 w-5 shrink-0 text-brand sm:block" />
          <div className="min-w-0 flex-1">
            <label htmlFor="sb-out" className={label}>Check out</label>
            <input id="sb-out" type="date" min={checkIn ? addDaysIso(checkIn, 1) : todayIso()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={field} />
          </div>
        </div>
      </div>
      <div className="hidden h-8 w-px bg-line md:block" />
      <div className={cn(cell, 'md:max-w-44')}>
        <Users className="h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <label htmlFor="sb-guests" className={label}>Guests</label>
          <input id="sb-guests" type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Add guests" className={field} />
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 font-semibold text-white shadow-[0_10px_24px_-10px_var(--brand)] transition hover:brightness-110 md:h-14 md:rounded-[22px]"
      >
        <Search className="h-5 w-5" />
        <span className="md:hidden lg:inline">Search</span>
      </motion.button>
    </motion.form>
  );
}
