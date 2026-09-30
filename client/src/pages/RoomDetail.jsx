import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Share2, Star, Users, BedDouble, Home as HomeIcon, BadgeCheck, KeyRound, Sparkles, Phone, SearchX } from 'lucide-react';
import { useGetRoomQuery, useGetSimilarQuery } from '../store/api';
import Gallery from '../components/room/Gallery';
import BookingPanel from '../components/room/BookingPanel';
import Reviews from '../components/room/Reviews';
import HeartButton from '../components/HeartButton';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard';
import { amenityIcon } from '../components/amenities';
import Skeleton, { SkeletonText } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { EmptyState, Reveal } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { plural } from '../lib/format';

const HIGHLIGHTS = [
  { icon: HomeIcon, title: 'Clean & safe stay', text: 'Professionally cleaned between every guest.' },
  { icon: BadgeCheck, title: 'Verified property', text: 'Photos and details checked by our team.' },
  { icon: KeyRound, title: 'Smooth check-in', text: 'Your booking reference is all you need.' },
];

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 md:pt-28 lg:px-8">
      <Skeleton className="h-9 w-2/3 max-w-lg" />
      <Skeleton className="mt-3 h-4 w-60" />
      <Skeleton className="mt-6 h-[300px] rounded-[28px] sm:h-[460px]" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <SkeletonText lines={6} />
        <Skeleton className="hidden h-96 rounded-[28px] lg:block" />
      </div>
    </div>
  );
}

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: room, isLoading, error } = useGetRoomQuery(id);
  const { data: similar, isLoading: similarLoading } = useGetSimilarQuery(id, { skip: !room });

  useEffect(() => {
    if (room) document.title = `${room.roomType} at ${room.hotel.name} · QuickStay`;
  }, [room]);

  if (isLoading) return <DetailSkeleton />;
  if (error || !room) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-28 pt-32">
        <EmptyState icon={SearchX} title="Room not found" description="This room may have been removed or the link is out of date." action={<Button to="/rooms">Browse stays</Button>} />
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) await navigator.share({ title: room.hotel.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-40 pt-20 sm:px-6 md:pt-28 lg:px-8 lg:pb-20">
      <div className="mb-4 hidden items-center justify-between sm:flex">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="relative">
        <Gallery images={room.images} />
        <div className="absolute right-0 top-3 flex gap-2 sm:hidden">
          <button onClick={share} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md" aria-label="Share"><Share2 className="h-4 w-4 text-slate-700" /></button>
          <HeartButton roomId={room.id} />
        </div>
        <button onClick={() => navigate(-1)} className="absolute left-0 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md sm:hidden" aria-label="Back">
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{room.hotel.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="font-medium text-ink">{room.roomType}</span>
            {room.rating && (
              <a href="#reviews" className="flex items-center gap-1 text-ink hover:underline">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {room.rating} ({plural(room.reviewCount, 'review')})
              </a>
            )}
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {room.hotel.address}, {room.hotel.city}</span>
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button variant="secondary" size="sm" onClick={share}><Share2 className="h-4 w-4" /> Share</Button>
          <HeartButton roomId={room.id} className="h-9 w-9 border border-line bg-surface" />
        </div>
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <div className="flex flex-wrap gap-3">
            {[[Users, `Up to ${room.maxGuests} guests`], [BedDouble, room.roomType], [Sparkles, `${room.totalUnits} room${room.totalUnits > 1 ? 's' : ''} of this type`]].map(([Icon, t]) => (
              <span key={t} className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink"><Icon className="h-4 w-4 text-brand" /> {t}</span>
            ))}
          </div>

          <Reveal>
            <p className="text-base leading-7 text-ink">{room.description}</p>
            {room.hotel.description && <p className="mt-4 leading-7 text-muted">{room.hotel.description}</p>}
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-[20px] border border-line bg-surface p-4">
                <Icon className="h-5 w-5 text-brand" />
                <p className="mt-3 font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>

          <Reveal>
            <h2 className="text-2xl font-semibold text-ink">What this room offers</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {room.amenities.map((a) => {
                const Icon = amenityIcon(a);
                return (
                  <div key={a} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
                    <Icon className="h-5 w-5 text-ink" />
                    <span className="text-sm text-ink">{a}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <div className="h-px bg-line" />
          <Reviews room={room} />
          <div className="h-px bg-line" />

          <div>
            <h2 className="text-2xl font-semibold text-ink">Where you'll be</h2>
            <p className="mt-2 text-muted">{room.hotel.address}, {room.hotel.city}, {room.hotel.country}</p>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-line">
              <iframe
                title="Map"
                loading="lazy"
                className="h-72 w-full grayscale-[30%] dark:invert-[0.9] dark:hue-rotate-180"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${room.hotel.name}, ${room.hotel.address}, ${room.hotel.city}`)}&output=embed`}
              />
            </div>
            {room.hotel.contact && (
              <a href={`tel:${room.hotel.contact.replace(/\s/g, '')}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand">
                <Phone className="h-4 w-4" /> {room.hotel.contact}
              </a>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel room={room} mobileOpen={sheetOpen} setMobileOpen={setSheetOpen} />
        </div>
      </div>

      <section className="mt-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">You might also like</h2>
          <Link to="/rooms" className="text-sm font-semibold text-brand">See all</Link>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {similarLoading ? Array.from({ length: 4 }).map((_, i) => <RoomCardSkeleton key={i} />) : similar?.map((r, i) => <RoomCard key={r.id} room={r} index={i} />)}
        </div>
      </section>
    </div>
  );
}
