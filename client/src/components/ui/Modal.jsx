import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

// Centered dialog on desktop, bottom sheet on mobile.
export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-line bg-surface shadow-2xl sm:rounded-[28px]',
              width
            )}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line sm:hidden" />
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 sm:pt-6">
                <div>
                  {title && <h2 className="text-xl font-semibold text-ink">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                </div>
                <button onClick={onClose} className="-mr-2 rounded-full p-2 text-muted transition hover:bg-surface-2 hover:text-ink" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto px-6 pb-6 pt-2">{children}</div>
            {footer && <div className="border-t border-line bg-surface px-6 py-4 pb-safe">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button onClick={onClose} className="h-11 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:bg-surface-2">
          Keep it
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'h-11 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-60',
            tone === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-brand hover:brightness-110'
          )}
        >
          {loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
