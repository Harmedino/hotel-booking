import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';
import { imageUrl } from '../../lib/config';

export function Stars({ value = 0, size = 'h-4 w-4', className }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(size, i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-line')} />
      ))}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          type="button"
          key={i}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.15 }}
          onClick={() => onChange(i)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          aria-checked={value === i}
          role="radio"
        >
          <Star className={cn('h-8 w-8 transition-colors', i <= value ? 'fill-amber-400 text-amber-400' : 'text-line')} />
        </motion.button>
      ))}
    </div>
  );
}

export function Avatar({ name, src, className }) {
  if (src) return <img src={imageUrl(src)} alt={name} className={cn('h-10 w-10 rounded-full object-cover', className)} />;
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-sm font-semibold text-white', className)}>
      {initials(name)}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-brand' : 'bg-line')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')}
      />
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center rounded-[28px] border border-dashed border-line bg-surface px-6 py-14 text-center', className)}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

// Fades + lifts children in when scrolled into view.
export function Reveal({ children, delay = 0, className, y = 24 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
