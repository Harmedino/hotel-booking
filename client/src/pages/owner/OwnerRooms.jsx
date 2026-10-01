import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Pencil, Plus, Trash2, Users, Star, ExternalLink } from 'lucide-react';
import { OwnerHeader } from './OwnerLayout';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { ConfirmModal } from '../../components/ui/Modal';
import { EmptyState, Switch } from '../../components/ui/misc';
import { useToast } from '../../components/ui/Toast';
import { useDeleteRoomMutation, useOwnerRoomsQuery, useUpdateRoomMutation, errorMessage } from '../../store/api';
import { imageUrl } from '../../lib/config';
import { moneyRound } from '../../lib/format';
import { cn } from '../../lib/cn';

export default function OwnerRooms() {
  const { data: rooms = [], isLoading } = useOwnerRoomsQuery();
  const [updateRoom] = useUpdateRoomMutation();
  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation();
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  const toggle = async (room) => {
    try {
      await updateRoom({ id: room.id, isAvailable: !room.isAvailable }).unwrap();
      toast.success(room.isAvailable ? 'Room paused. It won’t show in search.' : 'Room is live again');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    try {
      await deleteRoom(confirm.id).unwrap();
      toast.success('Room deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(errorMessage(err));
      setConfirm(null);
    }
  };

  return (
    <>
      <OwnerHeader title="Rooms" description={`${rooms.length} listing${rooms.length === 1 ? '' : 's'} across your properties`} action={
        <div className="flex gap-2">
          {/* The phone tab bar has no room for Properties. */}
          <Button to="/owner/properties" variant="secondary" className="lg:hidden">Properties</Button>
          <Button to="/owner/rooms/new"><Plus className="h-4 w-4" /> Add room</Button>
        </div>
      } />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-[24px]" />)}</div>
      ) : rooms.length === 0 ? (
        <EmptyState icon={BedDouble} title="No rooms yet" description="Add photos, a price and amenities. It takes about two minutes." action={<Button to="/owner/rooms/new">Add your first room</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((r) => (
            <div key={r.id} className={cn('overflow-hidden rounded-[24px] border border-line bg-surface transition', !r.isAvailable && 'opacity-70')}>
              <div className="relative aspect-[16/10]">
                <img src={imageUrl(r.images[0])} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold', r.isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white')}>
                  {r.isAvailable ? 'Live' : 'Paused'}
                </span>
                <Link to={`/rooms/${r.id}`} target="_blank" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800" aria-label="View listing"><ExternalLink className="h-4 w-4" /></Link>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{r.roomType}</p>
                    <p className="truncate text-sm text-muted">{r.hotel.name} · {r.hotel.city}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-ink">{moneyRound(r.pricePerNight)}<span className="text-xs font-normal text-muted">/nt</span></p>
                </div>
                <div className="flex gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {r.maxGuests}</span>
                  <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {r.totalUnits} units</span>
                  {r.rating && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {r.rating} ({r.reviewCount})</span>}
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <Switch checked={r.isAvailable} onChange={() => toggle(r)} label="Accepting bookings" /> Bookable
                  </label>
                  <div className="flex gap-1">
                    <Button to={`/owner/rooms/${r.id}/edit`} variant="ghost" size="icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => setConfirm(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete this room?"
        description="This removes the listing, its reviews and past bookings. Rooms with upcoming bookings can only be paused."
        confirmLabel="Delete room"
      />
    </>
  );
}
