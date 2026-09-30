import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useForgotPasswordMutation, errorMessage } from '../store/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [forgot, { isLoading, data, error }] = useForgotPasswordMutation();

  if (data) {
    return (
      <AuthLayout title="Check your inbox" subtitle={data.message}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><MailCheck className="h-6 w-6" /></div>
        {data.devResetUrl && (
          <p className="mt-6 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
            Email isn't configured on this server, so here's your link: <a className="break-all font-semibold underline" href={data.devResetUrl}>reset password</a>
          </p>
        )}
        <Link to="/login" className="mt-8 inline-block text-sm font-semibold text-brand">Back to sign in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={(e) => { e.preventDefault(); forgot(email); }} className="space-y-4">
        <Input label="Email" type="email" icon={Mail} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        {error && <p className="text-sm text-rose-500">{errorMessage(error)}</p>}
        <Button size="lg" className="w-full" loading={isLoading}>Send reset link</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted"><Link to="/login" className="font-semibold text-brand">Back to sign in</Link></p>
    </AuthLayout>
  );
}
