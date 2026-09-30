import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

export const inputClass =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-60';

export function Field({ label, error, hint, children, className, htmlFor }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-rose-500">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, className, icon: Icon, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} hint={hint} className={className} htmlFor={inputId}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />}
        <input ref={ref} id={inputId} className={cn(inputClass, Icon && 'pl-11', error && 'border-rose-400')} {...props} />
      </div>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, className, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} hint={hint} className={className} htmlFor={inputId}>
      <textarea ref={ref} id={inputId} className={cn(inputClass, 'min-h-28 resize-y')} {...props} />
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, error, className, children, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} error={error} className={className} htmlFor={inputId}>
      <select ref={ref} id={inputId} className={cn(inputClass, 'appearance-none pr-10 bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_14px_center] bg-no-repeat')} {...props}>
        {children}
      </select>
    </Field>
  );
});
