import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ImagePlus, Loader2, Star, X, ArrowLeft, Plus } from 'lucide-react';
import { OwnerHeader } from './OwnerLayout';
import { Input, Select, Textarea } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { Switch } from '../../components/ui/misc';
import { useToast } from '../../components/ui/Toast';
import { AMENITY_OPTIONS, amenityIcon } from '../../components/amenities';
import { useCreateRoomMutation, useOwnerHotelsQuery, useOwnerRoomsQuery, useUpdateRoomMutation, useUploadImagesMutation, errorMessage } from '../../store/api';
import { compressImage } from '../../lib/images';
import { imageUrl } from '../../lib/config';
import { cn } from '../../lib/cn';

const TYPES = ['Single Bed', 'Double Bed', 'Family Suite', 'Luxury Room', 'Studio', 'Penthouse'];
const EMPTY = { hotelId: '', roomType: 'Double Bed', description: '', pricePerNight: '', maxGuests: 2, totalUnits: 1, amenities: ['Free WiFi'], images: [], isAvailable: true };

export default function RoomForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { data: hotels, isLoading: hotelsLoading } = useOwnerHotelsQuery();
  const { data: rooms, isLoading: roomsLoading } = useOwnerRoomsQuery(undefined, { skip: !editing });
  const [form, setForm] = useState(EMPTY);
  const [custom, setCustom] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef(null);
  const [upload] = useUploadImagesMutation();
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: updating }] = useUpdateRoomMutation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (editing && rooms) {
      const r = rooms.find((x) => x.id === id);
      if (r) setForm({ hotelId: r.hotelId, roomType: r.roomType, description: r.description, pricePerNight: r.pricePerNight, maxGuests: r.maxGuests, totalUnits: r.totalUnits, amenities: r.amenities, images: r.images, isAvailable: r.isAvailable });
    }
  }, [editing, rooms, id]);

  useEffect(() => {
    if (!editing && hotels?.length && !form.hotelId) setForm((f) => ({ ...f, hotelId: hotels[0].id }));
  }, [hotels, editing, form.hotelId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/')).slice(0, 8 - form.images.length);
    if (!files.length) return;
    setUploading(files.length);
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      const { urls } = await upload(compressed).unwrap();
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 8) }));
    } catch (err) {
      toast.error(errorMessage(err, 'Upload failed'));
    } finally {
      setUploading(0);
    }
  };

  const toggleAmenity = (a) => set('amenities', form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.images.length) return toast.error('Add at least one photo');
    const body = { ...form, pricePerNight: Number(form.pricePerNight), maxGuests: Number(form.maxGuests), totalUnits: Number(form.totalUnits) };
    try {
      if (editing) await updateRoom({ id, ...body }).unwrap();
      else await createRoom(body).unwrap();
      toast.success(editing ? 'Room updated' : 'Room published! It’s now bookable.');
      navigate('/owner/rooms');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (hotelsLoading || (editing && roomsLoading)) return <Skeleton className="h-[600px] rounded-[24px]" />;

  if (!hotels?.length) {
    return (
      <div className="rounded-[24px] border border-line bg-surface p-8 text-center">
        <p className="text-ink">Create a property first, then add rooms to it.</p>
        <Button to="/owner/properties" className="mt-4">Add property</Button>
      </div>
    );
  }

  const allAmenities = [...new Set([...AMENITY_OPTIONS, ...form.amenities])];

  return (
    <>
      <button onClick={() => navigate('/owner/rooms')} className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Rooms</button>
      <OwnerHeader title={editing ? 'Edit room' : 'Add a room'} description="Great photos and a clear description get more bookings." />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-line bg-surface p-5">
            <h2 className="mb-1 font-semibold text-ink">Photos</h2>
            <p className="mb-4 text-sm text-muted">Up to 8. The first photo is your cover. Click a photo to make it the cover.</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              className={cn('grid grid-cols-2 gap-3 rounded-2xl sm:grid-cols-4', dragging && 'ring-4 ring-[var(--ring)]')}
            >
              <AnimatePresence>
                {form.images.map((src, i) => (
                  <motion.div key={src} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={cn('group relative aspect-square overflow-hidden rounded-2xl', i === 0 && 'ring-2 ring-brand')}>
                    <button type="button" onClick={() => set('images', [src, ...form.images.filter((x) => x !== src)])} className="h-full w-full">
                      <img src={imageUrl(src)} alt="" className="h-full w-full object-cover" />
                    </button>
                    {i === 0 && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white"><Star className="h-3 w-3" /> Cover</span>}
                    <button type="button" onClick={() => set('images', form.images.filter((x) => x !== src))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" aria-label="Remove photo">
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {Array.from({ length: uploading }).map((_, i) => (
                <div key={`u${i}`} className="skeleton flex aspect-square items-center justify-center rounded-2xl"><Loader2 className="h-5 w-5 animate-spin text-muted" /></div>
              ))}
              {form.images.length + uploading < 8 && (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-brand hover:text-brand">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-medium">Add photos</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </section>

          <section className="space-y-4 rounded-[24px] border border-line bg-surface p-5">
            <h2 className="font-semibold text-ink">Details</h2>
            <Select label="Property" value={form.hotelId} onChange={(e) => set('hotelId', e.target.value)} required>
              {hotels.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
            </Select>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Room type</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...TYPES, form.roomType])].map((t) => (
                  <button type="button" key={t} onClick={() => set('roomType', t)} className={cn('rounded-full border px-3.5 py-2 text-sm font-medium transition', form.roomType === t ? 'border-brand bg-brand text-white' : 'border-line text-ink hover:border-ink/30')}>{t}</button>
                ))}
              </div>
            </div>
            <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Bed size, view, bathroom, what makes it special…" />
          </section>

          <section className="rounded-[24px] border border-line bg-surface p-5">
            <h2 className="mb-4 font-semibold text-ink">Amenities</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allAmenities.map((a) => {
                const Icon = amenityIcon(a);
                const on = form.amenities.includes(a);
                return (
                  <button type="button" key={a} onClick={() => toggleAmenity(a)} className={cn('flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm transition', on ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink hover:border-ink/30')}>
                    <Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{a}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own" className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-brand" />
              <Button type="button" variant="secondary" size="sm" className="h-10" disabled={!custom.trim()} onClick={() => { toggleAmenity(custom.trim()); setCustom(''); }}><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="space-y-4 rounded-[24px] border border-line bg-surface p-5">
            <h2 className="font-semibold text-ink">Pricing & capacity</h2>
            <Input label="Price per night (USD)" type="number" min={1} step="0.01" required value={form.pricePerNight} onChange={(e) => set('pricePerNight', e.target.value)} placeholder="199" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Max guests" type="number" min={1} max={20} required value={form.maxGuests} onChange={(e) => set('maxGuests', e.target.value)} />
              <Input label="Units" type="number" min={1} max={500} required value={form.totalUnits} onChange={(e) => set('totalUnits', e.target.value)} hint="Identical rooms" />
            </div>
            <label className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink">
              Accepting bookings
              <Switch checked={form.isAvailable} onChange={(v) => set('isAvailable', v)} label="Accepting bookings" />
            </label>
          </section>
          <Button size="lg" className="w-full" loading={creating || updating} disabled={uploading > 0}>
            {editing ? 'Save changes' : 'Publish room'}
          </Button>
        </div>
      </form>
    </>
  );
}
