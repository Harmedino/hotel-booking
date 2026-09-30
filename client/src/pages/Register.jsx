import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, UserRound, Check } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useRegisterMutation, errorMessage } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { cn } from '../lib/cn';
import { safeNext } from '../lib/safeNext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const checks = [
    ['At least 8 characters', form.password.length >= 8],
    ['Passwords match', form.password && form.password === form.confirm],
  ];

  const submit = async (e) => {
    e.preventDefault();
    if (!checks.every(([, ok]) => ok)) return setError('Please fix the password requirements below.');
    setError('');
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password }).unwrap();
      dispatch(setCredentials(res));
      toast.success('Account created. Welcome to QuickStay!');
      navigate(safeNext(params.get('next')), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthLayout title="Create your account" subtitle="Save stays, track trips and book faster.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" icon={UserRound} required minLength={2} autoComplete="name" value={form.name} onChange={set('name')} placeholder="Ada Lovelace" />
        <Input label="Email" type="email" icon={Mail} required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Password" type="password" icon={Lock} required autoComplete="new-password" value={form.password} onChange={set('password')} />
          <Input label="Confirm password" type="password" icon={Lock} required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        </div>
        <ul className="space-y-1.5">
          {checks.map(([label, ok]) => (
            <li key={label} className={cn('flex items-center gap-2 text-xs transition', ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted')}>
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', ok ? 'border-transparent bg-emerald-500 text-white' : 'border-line')}>
                {ok && <Check className="h-3 w-3" />}
              </span>
              {label}
            </li>
          ))}
        </ul>
        {error && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <Button size="lg" className="w-full" loading={isLoading}>Create account</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account? <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`} className="font-semibold text-brand">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
