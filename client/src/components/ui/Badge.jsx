import { cn } from '../../lib/cn';

const tones = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand',
  green: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  red: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-300',
};

export default function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}

const STATUS = {
  pending: { tone: 'amber', label: 'Awaiting payment' },
  confirmed: { tone: 'green', label: 'Confirmed' },
  checked_in: { tone: 'violet', label: 'Checked in' },
  completed: { tone: 'brand', label: 'Completed' },
  cancelled: { tone: 'red', label: 'Cancelled' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || { tone: 'neutral', label: status };
  return (
    <Badge tone={s.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </Badge>
  );
}
