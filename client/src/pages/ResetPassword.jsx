import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Lock } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useResetPasswordMutation, errorMessage } from '../store/api';
import { setCredentials } from '../store/authSlice';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [reset, { isLoading }] = useResetPasswordMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    try {
      const res = await reset({ token, password }).unwrap();
      dispatch(setCredentials(res));
      toast.success('Password updated. You are signed in.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing its token.">
        <Button to="/forgot-password">Request a new link</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Input label="New password" type="password" icon={Lock} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <Input label="Confirm password" type="password" icon={Lock} required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button size="lg" className="w-full" loading={isLoading}>Update password</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted"><Link to="/login" className="font-semibold text-brand">Back to sign in</Link></p>
    </AuthLayout>
  );
}
