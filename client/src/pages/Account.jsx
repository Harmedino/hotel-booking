import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, Moon, Sun, CalendarCheck, Heart, LayoutDashboard, Building2, ChevronRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { Avatar, Switch } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { useChangePasswordMutation, useUpdateMeMutation, useUploadImagesMutation, errorMessage } from '../store/api';
import { logout } from '../store/authSlice';
import { compressImage } from '../lib/images';

const card = 'rounded-[28px] border border-line bg-surface p-6';

export default function Account({ theme, toggleTheme }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();
  const [upload, { isLoading: uploading }] = useUploadImagesMutation();
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateMe(profile).unwrap();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await changePassword(pw).unwrap();
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const small = await compressImage(file, 400);
      const { urls } = await upload([small]).unwrap();
      await updateMe({ avatarUrl: urls[0] }).unwrap();
      toast.success('Photo updated');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const links = [
    ['/my-bookings', 'My trips', CalendarCheck],
    ['/saved', 'Saved stays', Heart],
    user.role === 'owner' ? ['/owner', 'Owner dashboard', LayoutDashboard] : ['/list-property', 'List your property', Building2],
  ];

  return (
    <PageShell title="Account" className="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <div className={`${card} text-center`}>
            <div className="relative mx-auto w-fit">
              <Avatar name={user.name} src={user.avatarUrl} className="h-24 w-24 text-2xl" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-surface bg-brand text-white" aria-label="Change photo">
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            </div>
            <p className="mt-4 text-lg font-semibold text-ink">{user.name}</p>
            <p className="text-sm text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-muted">Member since {new Date(user.createdAt).getFullYear()}</p>
          </div>
          <div className={`${card} p-2`}>
            {links.map(([to, label, Icon]) => (
              <button key={to} onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-ink hover:bg-surface-2">
                <Icon className="h-4 w-4 text-muted" /> <span className="flex-1 text-left">{label}</span> <ChevronRight className="h-4 w-4 text-muted" />
              </button>
            ))}
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-ink">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-muted" /> : <Sun className="h-4 w-4 text-muted" />}
              <span className="flex-1">Dark mode</span>
              <Switch checked={theme === 'dark'} onChange={toggleTheme} label="Dark mode" />
            </div>
            <button onClick={() => { dispatch(logout()); navigate('/'); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/10">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <form onSubmit={saveProfile} className={`${card} space-y-4`}>
            <h2 className="text-lg font-semibold text-ink">Personal details</h2>
            <Input label="Full name" required minLength={2} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Input label="Email" value={user.email} disabled hint="Contact support to change your email." />
            <Input label="Phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Used to prefill bookings" />
            <Button loading={saving}>Save changes</Button>
          </form>
          <form onSubmit={savePassword} className={`${card} space-y-4`}>
            <h2 className="text-lg font-semibold text-ink">Password</h2>
            <Input label="Current password" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" />
            <Input label="New password" type="password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" hint="At least 8 characters" />
            <Button variant="secondary" loading={changing}>Update password</Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
