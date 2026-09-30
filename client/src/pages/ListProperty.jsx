import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, BarChart3, CalendarCheck, CreditCard } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { Input, Textarea } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { useCreateHotelMutation, errorMessage } from '../store/api';

const PERKS = [
  [CalendarCheck, 'Real-time availability', 'No double bookings, ever.'],
  [CreditCard, 'Get paid your way', 'Card payments or pay at hotel.'],
  [BarChart3, 'Revenue analytics', 'Occupancy, ADR and trends at a glance.'],
];

export default function ListProperty() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', city: '', country: '', contact: user?.phone || '', description: '' });
  const [createHotel, { isLoading }] = useCreateHotelMutation();
  const navigate = useNavigate();
  const toast = useToast();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createHotel(form).unwrap();
      toast.success('Your property is live! Now add your first room.');
      navigate('/owner/rooms/new');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <PageShell className="max-w-5xl">
      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand"><Building2 className="h-3.5 w-3.5" /> For hosts</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink">List your property in minutes.</h1>
          <p className="mt-3 text-muted">Tell us about your hotel. Next you'll add rooms and photos, and you're open for bookings.</p>
          <div className="mt-8 space-y-5">
            {PERKS.map(([Icon, title, text]) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></div>
                <div><p className="font-semibold text-ink">{title}</p><p className="text-sm text-muted">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-[28px] border border-line bg-surface p-6 shadow-card">
          <Input label="Property name" required value={form.name} onChange={set('name')} placeholder="e.g. Seaside Suites" />
          <Input label="Street address" required value={form.address} onChange={set('address')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" required value={form.city} onChange={set('city')} />
            <Input label="Country" value={form.country} onChange={set('country')} />
          </div>
          <Input label="Contact phone" value={form.contact} onChange={set('contact')} />
          <Textarea label="Describe your property" value={form.description} onChange={set('description')} placeholder="What makes staying with you special?" />
          <Button size="lg" className="w-full" loading={isLoading}>Create property</Button>
        </form>
      </div>
    </PageShell>
  );
}
