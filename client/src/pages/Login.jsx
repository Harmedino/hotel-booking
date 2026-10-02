import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useLoginMutation, errorMessage } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { safeNext } from '../lib/safeNext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const doLogin = async (creds) => {
    setError('');
    try {
      const res = await login(creds).unwrap();
      dispatch(setCredentials(res));
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      navigate(safeNext(params.get('next'), res.user.role === 'owner' ? '/owner' : '/'), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your trips and saved stays.">
      <form onSubmit={(e) => { e.preventDefault(); doLogin(form); }} className="space-y-4">
        <Input label="Email" type="email" icon={Mail} required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <Input label="Password" type="password" icon={Lock} required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand">Forgot password?</Link>
        </div>
        {error && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <Button size="lg" className="w-full" loading={isLoading}>Sign in</Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        New to QuickStay? <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`} className="font-semibold text-brand">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
