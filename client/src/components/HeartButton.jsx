import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToggleSavedMutation, useWishlistIdsQuery } from '../store/api';
import { useToast } from './ui/Toast';
import { cn } from '../lib/cn';

export default function HeartButton({ roomId, className }) {
  const { isAuthed } = useAuth();
  const { data: ids = [] } = useWishlistIdsQuery(undefined, { skip: !isAuthed });
  const [toggle] = useToggleSavedMutation();
  const navigate = useNavigate();
  const toast = useToast();
  const saved = ids.includes(roomId);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      toast.info('Sign in to save stays you love');
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      await toggle({ roomId, saved: !saved }).unwrap();
      if (!saved) toast.success('Saved to your list');
    } catch {
      toast.error('Could not update your saved stays');
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={onClick}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      aria-pressed={saved}
      className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105', className)}
    >
      <motion.span key={String(saved)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
        <Heart className={cn('h-[18px] w-[18px]', saved ? 'fill-rose-500 text-rose-500' : 'text-slate-700')} />
      </motion.span>
    </motion.button>
  );
}
