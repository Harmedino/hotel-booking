import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const variants = {
  primary: 'bg-brand text-white shadow-[0_8px_20px_-8px_var(--brand)] hover:brightness-110',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  dark: 'bg-ink text-bg hover:opacity-90',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
  soft: 'bg-brand-soft text-brand hover:brightness-95',
};
const sizes = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2',
  icon: 'h-10 w-10',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, to, disabled, ...props },
  ref
) {
  const classes = cn(
    'relative inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 select-none',
    variants[variant],
    sizes[size],
    className
  );
  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
});

export default Button;
