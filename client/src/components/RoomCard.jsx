import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Star, Users } from 'lucide-react';
import { imageUrl } from '../lib/config';
import { moneyRound } from '../lib/format';
import HeartButton from './HeartButton';
import Skeleton from './ui/Skeleton';
import { cn } from '../lib/cn';

export default function RoomCard({ room, index = 0, search = '', className }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const images = room.images?.length ? room.images : [''];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Link to={`/rooms/${room.id}${search}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-surface-2">
          {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
          <img
            src={imageUrl(images[imgIdx])}
            alt={`${room.roomType} at ${room.hotel?.name}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={cn('h-full w-full object-cover transition duration-700 group-hover:scale-105', loaded ? 'opacity-100' : 'opacity-0')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          <HeartButton roomId={room.id} className="absolute right-3 top-3" />
          {room.rating >= 4.5 && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow">
              Guest favourite
            </span>
          )}
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 opacity-0 transition group-hover:opacity-100">
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  aria-label={`Show photo ${i + 1}`}
                  className={cn('h-1.5 rounded-full bg-white transition-all', i === imgIdx ? 'w-5' : 'w-1.5 opacity-70')}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1 px-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-ink">{room.hotel?.name}</h3>
            {room.rating ? (
              <span className="flex shrink-0 items-center gap-1 text-sm text-ink">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {room.rating.toFixed(1)}
                <span className="text-muted">({room.reviewCount})</span>
              </span>
            ) : (
              <span className="shrink-0 text-xs font-medium text-brand">New</span>
            )}
          </div>
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" /> {room.hotel?.city}, {room.hotel?.country}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted">
            {room.roomType} · <Users className="h-3.5 w-3.5" /> up to {room.maxGuests}
          </p>
          <p className="pt-1 text-ink">
            <span className="font-semibold">{moneyRound(room.pricePerNight)}</span>
            <span className="text-sm text-muted"> / night</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function RoomCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] rounded-[24px]" />
      <div className="mt-3 space-y-2 px-1">
        <Skeleton className="h-4 w-2/3 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
        <Skeleton className="h-3 w-1/3 rounded-full" />
      </div>
    </div>
  );
}
