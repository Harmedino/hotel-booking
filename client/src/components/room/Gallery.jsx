import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Grid2x2, X } from 'lucide-react';
import { imageUrl } from '../../lib/config';
import { cn } from '../../lib/cn';

function Lightbox({ images, index, onClose, onIndex }) {
  const touch = useRef(null);
  const go = useCallback((d) => onIndex((index + d + images.length) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm text-white/70">{index + 1} / {images.length}</span>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Close gallery"><X className="h-6 w-6" /></button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={imageUrl(images[index])}
            alt=""
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="max-h-[80dvh] max-w-full rounded-2xl object-contain"
          />
        </AnimatePresence>
        <button onClick={() => go(-1)} className="absolute left-4 hidden rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block" aria-label="Previous photo"><ChevronLeft /></button>
        <button onClick={() => go(1)} className="absolute right-4 hidden rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block" aria-label="Next photo"><ChevronRight /></button>
      </div>
      <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto p-4">
        {images.map((src, i) => (
          <button key={i} onClick={() => onIndex(i)} className={cn('h-14 w-20 shrink-0 overflow-hidden rounded-lg transition', i === index ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100')}>
            <img src={imageUrl(src)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </motion.div>,
    document.body
  );
}

export default function Gallery({ images = [] }) {
  const [open, setOpen] = useState(null);
  const [mobileIdx, setMobileIdx] = useState(0);
  const scroller = useRef(null);

  return (
    <>
      {/* Mobile: swipeable carousel */}
      <div className="relative -mx-4 sm:hidden">
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setMobileIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((src, i) => (
            <button key={i} onClick={() => setOpen(i)} className="aspect-[4/3] w-full shrink-0 snap-center">
              <img src={imageUrl(src)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <span className="absolute bottom-3 right-4 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
          {mobileIdx + 1} / {images.length}
        </span>
      </div>

      {/* Desktop: mosaic */}
      <div className="relative hidden h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[28px] sm:grid">
        {images.slice(0, 5).map((src, i) => (
          <motion.button
            key={i}
            onClick={() => setOpen(i)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            className={cn('group overflow-hidden bg-surface-2', i === 0 ? 'col-span-2 row-span-2' : images.length < 4 ? 'col-span-2' : '')}
          >
            <img src={imageUrl(src)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-90" />
          </motion.button>
        ))}
        <button onClick={() => setOpen(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-50">
          <Grid2x2 className="h-4 w-4" /> Show all photos
        </button>
      </div>

      <AnimatePresence>
        {open !== null && <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </>
  );
}
