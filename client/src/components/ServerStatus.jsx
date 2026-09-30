import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, ServerCrash } from 'lucide-react';
import { API_URL } from '../lib/config';

// Free hosting plans sleep when idle and the first request can take up to a
// minute. Say so, instead of letting sign-up or search silently fail.
export default function ServerStatus() {
  const [state, setState] = useState('ok'); // ok | waking | down

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer;
    const slow = setTimeout(() => !cancelled && setState((s) => (s === 'ok' ? 'waking' : s)), 3500);

    async function check() {
      attempts += 1;
      try {
        const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store' });
        if (res.ok) {
          clearTimeout(slow);
          if (!cancelled) setState('ok');
          return;
        }
        throw new Error(String(res.status));
      } catch {
        if (cancelled) return;
        setState(attempts >= 8 ? 'down' : 'waking');
        timer = setTimeout(check, 6000);
      }
    }
    check();
    return () => {
      cancelled = true;
      clearTimeout(slow);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {state !== 'ok' && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          role="status"
          className="no-print fixed inset-x-3 bottom-20 z-[90] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-card md:bottom-6"
        >
          {state === 'waking' ? (
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand" />
          ) : (
            <ServerCrash className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          )}
          <p className="text-ink">
            {state === 'waking'
              ? 'Connecting to the server. The first visit after a quiet spell can take up to a minute.'
              : "We can't reach the booking server right now. Please try again shortly."}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
