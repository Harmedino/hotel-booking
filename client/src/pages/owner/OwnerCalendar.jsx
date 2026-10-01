import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, LogIn, LogOut, BedDouble, Wrench, Ban, Trash2, CalendarDays } from 'lucide-react';
import { OwnerHeader } from './OwnerLayout';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/misc';
import { Input, Select } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { useCreateBlockMutation, useDeleteBlockMutation, useOwnerCalendarQuery, errorMessage } from '../../store/api';
import { addDaysIso, longDate, moneyRound, plural, shortDate, todayIso } from '../../lib/format';
import { cn } from '../../lib/cn';

const DAYS = 14;
const weekday = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
const isWeekend = (iso) => [5, 6].includes(new Date(`${iso}T12:00:00`).getDay());

/** Units blocked on a night, from a room's blocks. */
const blockedOn = (room, date) => room.blocks.filter((b) => b.start <= date && date < b.end).reduce((n, b) => n + b.units, 0);

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><Icon className={cn('h-3.5 w-3.5', tone)} /> {label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

/** /owner/calendar: rooms × nights, who's arriving and leaving, and blocked dates. */
export default function OwnerCalendar() {
  const today = todayIso();
  const [from, setFrom] = useState(today);
  const [selected, setSelected] = useState(null);
  const [blockFor, setBlockFor] = useState(null);
  const { data, isLoading, isFetching } = useOwnerCalendarQuery({ from, days: DAYS });
  const [deleteBlock] = useDeleteBlockMutation();
  const toast = useToast();

  const rooms = useMemo(() => data?.rooms || [], [data]);
  const dates = data?.dates || [];

  // Today at a glance, across every property.
  const glance = useMemo(() => {
    if (!data || from > today || today >= data.to) return null;
    const all = rooms.flatMap((r) => r.bookings);
    const units = rooms.reduce((n, r) => n + r.totalUnits, 0);
    const usedTonight = rooms.reduce((n, r) => n + (r.nights.find((x) => x.date === today)?.used || 0), 0);
    return {
      arriving: all.filter((b) => b.checkIn === today).length,
      leaving: all.filter((b) => b.checkOut === today).length,
      inHouse: all.filter((b) => b.checkIn <= today && today < b.checkOut).length,
      occupancy: units ? Math.round((usedTonight / units) * 100) : 0,
    };
  }, [data, rooms, from, today]);

  const room = selected && rooms.find((r) => r.id === selected.roomId);
  const detail = room && {
    arriving: room.bookings.filter((b) => b.checkIn === selected.date),
    staying: room.bookings.filter((b) => b.checkIn < selected.date && selected.date < b.checkOut),
    leaving: room.bookings.filter((b) => b.checkOut === selected.date),
    blocks: room.blocks.filter((b) => b.start <= selected.date && selected.date < b.end),
  };

  const removeBlock = async (id) => {
    try {
      await deleteBlock(id).unwrap();
      toast.success('Back on sale');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <OwnerHeader
        title="Calendar"
        description="Who's staying, night by night. Block rooms for repairs or your own use."
        action={<Button onClick={() => setBlockFor({ roomId: rooms[0]?.id || '', date: today })} disabled={!rooms.length}><Ban className="h-4 w-4" /> Block dates</Button>}
      />

      {glance && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={LogIn} label="Arriving today" value={glance.arriving} tone="text-emerald-500" />
          <Stat icon={LogOut} label="Leaving today" value={glance.leaving} tone="text-amber-500" />
          <Stat icon={BedDouble} label="Bookings in house" value={glance.inHouse} tone="text-brand" />
          <Stat icon={CalendarDays} label="Occupancy tonight" value={`${glance.occupancy}%`} tone="text-brand" />
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setFrom(addDaysIso(from, -7))} disabled={from <= today} className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-2 disabled:opacity-30" aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => setFrom(addDaysIso(from, 7))} className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-2" aria-label="Next week"><ChevronRight className="h-4 w-4" /></button>
        {from !== today && <Button variant="secondary" size="sm" onClick={() => setFrom(today)}>Today</Button>}
        <p className="ml-1 text-sm font-medium text-ink">{shortDate(from)} – {shortDate(addDaysIso(from, DAYS - 1))}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-[24px]" />
      ) : !rooms.length ? (
        <EmptyState icon={CalendarDays} title="No rooms yet" description="Add a room and its bookings will show up here." action={<Button to="/owner/rooms/new">Add room</Button>} />
      ) : (
        <div className={cn('overflow-hidden rounded-[24px] border border-line bg-surface transition-opacity', isFetching && 'opacity-60')}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-28 min-w-28 max-w-28 border-b border-line bg-surface px-3 py-2 text-left text-xs font-medium text-muted sm:w-auto sm:min-w-48 sm:max-w-none">Room</th>
                  {dates.map((d) => (
                    <th key={d} className={cn('min-w-12 border-b border-l border-line px-1 py-2 text-center text-[11px] font-medium', d === today ? 'text-brand' : 'text-muted', isWeekend(d) && 'bg-surface-2/60')}>
                      <span className="block">{weekday(d)}</span>
                      <span className={cn('mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs', d === today ? 'bg-brand font-semibold text-white' : 'text-ink')}>{Number(d.slice(8))}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="sticky left-0 z-10 w-28 min-w-28 max-w-28 border-b border-line bg-surface px-3 py-2 text-left font-normal sm:w-auto sm:min-w-48 sm:max-w-none">
                      <span className="block truncate font-semibold text-ink">{r.roomType}</span>
                      <span className="block truncate text-xs text-muted">{r.hotelName} · {plural(r.totalUnits, 'unit')}</span>
                    </th>
                    {r.nights.map((n) => {
                      const ratio = n.used / r.totalUnits;
                      const blocked = blockedOn(r, n.date);
                      const isSel = selected?.roomId === r.id && selected?.date === n.date;
                      return (
                        <td key={n.date} className={cn('border-b border-l border-line p-1', isWeekend(n.date) && 'bg-surface-2/60')}>
                          <button
                            type="button"
                            onClick={() => setSelected(isSel ? null : { roomId: r.id, date: n.date })}
                            aria-label={`${r.roomType}, ${longDate(n.date)}: ${n.used} of ${r.totalUnits} taken${blocked ? `, ${blocked} blocked` : ''}`}
                            className={cn(
                              'relative flex h-11 w-full min-w-10 flex-col items-center justify-center rounded-lg text-xs font-semibold transition',
                              ratio >= 1 ? 'bg-brand text-white' : ratio > 0 ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface-2',
                              isSel && 'ring-2 ring-ink ring-offset-1 ring-offset-surface',
                              !r.isAvailable && 'opacity-50'
                            )}
                          >
                            {n.used ? `${n.used}/${r.totalUnits}` : <span className="font-normal">{moneyRound(n.price)}</span>}
                            {blocked > 0 && <Wrench className={cn('absolute right-0.5 top-0.5 h-3 w-3', ratio >= 1 ? 'text-white/80' : 'text-amber-500')} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-soft" /> Partly taken</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand" /> Full</span>
            <span className="flex items-center gap-1.5"><Wrench className="h-3 w-3 text-amber-500" /> Blocked</span>
            <span>Empty nights show the price</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {detail && (
          <motion.section
            key={`${selected.roomId}-${selected.date}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 rounded-[24px] border border-line bg-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted">{room.hotelName}</p>
                <h2 className="text-lg font-semibold text-ink">{room.roomType} · {longDate(selected.date)}</h2>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setBlockFor(selected)}><Ban className="h-4 w-4" /> Block from this night</Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                ['Arriving', detail.arriving, LogIn],
                ['Staying', detail.staying, BedDouble],
                ['Leaving', detail.leaving, LogOut],
              ].map(([label, list, Icon]) => (
                <div key={label}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Icon className="h-3.5 w-3.5" /> {label}</p>
                  {list.length ? (
                    <ul className="space-y-2">
                      {list.map((b) => (
                        <li key={b.id} className="rounded-2xl bg-surface-2 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-ink">{b.guestName}</p>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted">{b.reference} · {shortDate(b.checkIn)} – {shortDate(b.checkOut)} · {plural(b.guests, 'guest')}{b.isPaid ? ' · Paid' : ''}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">Nobody</p>
                  )}
                </div>
              ))}
            </div>
            {detail.blocks.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Wrench className="h-3.5 w-3.5" /> Blocked</p>
                <ul className="space-y-2">
                  {detail.blocks.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-amber-500/10 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{plural(b.units, 'unit')}{b.note ? ` · ${b.note}` : ''}</p>
                        <p className="text-xs text-muted">Nights of {shortDate(b.start)} – {shortDate(addDaysIso(b.end, -1))}</p>
                      </div>
                      <button onClick={() => removeBlock(b.id)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-rose-600 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /> Unblock</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <BlockDatesModal open={Boolean(blockFor)} initial={blockFor} rooms={rooms} onClose={() => setBlockFor(null)} />
    </>
  );
}

function BlockDatesModal({ open, initial, rooms, onClose }) {
  const today = todayIso();
  const [form, setForm] = useState(null);
  const [createBlock, { isLoading }] = useCreateBlockMutation();
  const toast = useToast();

  // Reset from whichever night or button opened it.
  const key = initial ? `${initial.roomId}-${initial.date}` : '';
  const [openedFor, setOpenedFor] = useState('');
  if (open && key !== openedFor) {
    setOpenedFor(key);
    setForm({ roomId: initial.roomId, first: initial.date, last: initial.date, units: '', note: '' });
  }
  const room = form && rooms.find((r) => r.id === form.roomId);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createBlock({
        roomId: form.roomId,
        start: form.first,
        end: addDaysIso(form.last, 1),
        units: form.units ? Number(form.units) : undefined,
        note: form.note.trim(),
      }).unwrap();
      toast.success('Dates blocked. Guests can no longer book them.');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Block dates" description="Take rooms out of sale for repairs, deep cleaning or your own use.">
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <Select label="Room" value={form.roomId} onChange={(e) => set('roomId', e.target.value)}>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.roomType} · {r.hotelName}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First night" type="date" min={today} required value={form.first} onChange={(e) => setForm((f) => ({ ...f, first: e.target.value, last: f.last < e.target.value ? e.target.value : f.last }))} />
            <Input label="Last night" type="date" min={form.first} required value={form.last} onChange={(e) => set('last', e.target.value)} />
          </div>
          <Input
            label="How many units"
            type="number"
            min={1}
            max={room?.totalUnits || 1}
            value={form.units}
            onChange={(e) => set('units', e.target.value)}
            placeholder={room ? `All ${room.totalUnits}` : ''}
            hint={room && room.totalUnits > 1 ? `This room type has ${room.totalUnits}. Leave empty to block all of them.` : undefined}
          />
          <Input label="Note (optional)" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Repainting, plumbing, family visit…" maxLength={120} />
          <Button type="submit" size="lg" className="w-full" loading={isLoading}>Block {plural(Math.max(1, Math.round((Date.parse(form.last) - Date.parse(form.first)) / 86400000) + 1), 'night')}</Button>
        </form>
      )}
    </Modal>
  );
}
