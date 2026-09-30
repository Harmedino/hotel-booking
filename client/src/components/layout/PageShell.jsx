import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

// Standard page wrapper with enter animation and room for the fixed navbar.
export default function PageShell({ children, className, title, description, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 md:pb-20 md:pt-28 lg:px-8', className)}
    >
      {(title || actions) && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>}
            {description && <p className="mt-2 text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </motion.div>
  );
}
