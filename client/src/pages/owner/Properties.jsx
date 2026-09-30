import { useState } from 'react';
import { Building2, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { OwnerHeader } from './OwnerLayout';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Field';
import { Switch } from '../../components/ui/misc';
import { useToast } from '../../components/ui/Toast';
import { useCreateHotelMutation, useDeleteHotelMutation, useOwnerHotelsQuery, useUpdateHotelMutation, errorMessage } from '../../store/api';
import { imageUrl } from '../../lib/config';
import { cn } from '../../lib/cn';

const EMPTY = { name: '', address: '', city: '', country: '', contact: '', description: '' };

export default function Properties() {
  const { data: hotels = [], isLoading } = useOwnerHotelsQuery();
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [create, { isLoading: creating }] = useCreateHotelMutation();
  const [update, { isLoading: updating }] = useUpdateHotelMutation();
  const [remove, { isLoading: deleting }] = useDeleteHotelMutation();
  const toast = useToast();

  const open = (h) => {
    setEditing(h || 'new');
    setForm(h ? { name: h.name, address: h.address, city: h.city, country: h.country, contact: h.contact, description: h.description } : EMPTY);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await create(form).unwrap();
      else await update({ id: editing.id, ...form }).unwrap();
      toast.success(editing === 'new' ? 'Property added' : 'Property updated');
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const toggle = async (h) => {
    try {
      await update({ id: h.id, isActive: !h.isActive }).unwrap();
      toast.success(h.isActive ? 'Property hidden from guests' : 'Property is visible again');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    try {
      await remove(removing.id).unwrap();
      toast.success('Property deleted');
    } catch (err) {
      toast.error(errorMessage(err));
    }
    setRemoving(null);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <OwnerHeader title="Properties" description="Your hotels and their public details." action={<Button onClick={() => open(null)}><Plus className="h-4 w-4" /> Add property</Button>} />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-[24px]" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {hotels.map((h) => (
            <div key={h.id} className={cn('flex gap-4 rounded-[24px] border border-line bg-surface p-4 transition', !h.isActive && 'opacity-60')}>
              {h.coverImage ? <img src={imageUrl(h.coverImage)} alt="" className="h-28 w-28 shrink-0 rounded-2xl object-cover" /> : <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Building2 className="h-8 w-8" /></div>}
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-semibold text-ink">{h.name}</p>
                <p className="flex items-center gap-1 truncate text-sm text-muted"><MapPin className="h-3.5 w-3.5 shrink-0" /> {h.address}, {h.city}</p>
                {h.contact && <p className="flex items-center gap-1 truncate text-sm text-muted"><Phone className="h-3.5 w-3.5 shrink-0" /> {h.contact}</p>}
                <p className="mt-1 text-xs text-muted">{h.roomCount} room type{h.roomCount === 1 ? '' : 's'}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-sm text-ink"><Switch checked={h.isActive} onChange={() => toggle(h)} label="Visible to guests" /> Visible</label>
                  <div className="flex">
                    <Button variant="ghost" size="icon" onClick={() => open(h)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => setRemoving(h)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add property' : 'Edit property'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={set('name')} />
          <Input label="Address" required value={form.address} onChange={set('address')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" required value={form.city} onChange={set('city')} />
            <Input label="Country" value={form.country} onChange={set('country')} />
          </div>
          <Input label="Contact phone" value={form.contact} onChange={set('contact')} />
          <Textarea label="Description" value={form.description} onChange={set('description')} />
          <Button className="w-full" loading={creating || updating}>Save property</Button>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={doDelete}
        loading={deleting}
        title={`Delete ${removing?.name}?`}
        description="This permanently removes the property, all its rooms and booking history. Properties with upcoming bookings can only be hidden."
        confirmLabel="Delete property"
      />
    </>
  );
}
