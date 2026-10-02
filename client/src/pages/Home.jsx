import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, CalendarCheck, Copy, Search, ShieldCheck, Sparkles, Star, Zap, Building2, Check } from 'lucide-react';
import { assets, testimonials } from '../assets/assets';
import SearchBar from '../components/SearchBar';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { Reveal, SectionHeading, Stars } from '../components/ui/misc';
import { useToast } from '../components/ui/Toast';
import { useGetCitiesQuery, useGetFeaturedQuery, useGetOffersQuery, useGetStatsQuery, useSubscribeMutation, errorMessage } from '../store/api';
import { useCountUp } from '../hooks/useCountUp';
import { imageUrl } from '../lib/config';
import { moneyRound, shortDate } from '../lib/format';

const wrap = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

function Stat({ value, suffix = '', label, decimals = 0 }) {
  const [ref, n] = useCountUp(value);
  return (
    <div ref={ref}>
      <p className="text-3xl font-semibold text-white sm:text-4xl">
        {value ? n.toFixed(decimals) : '–'}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-white/70">{label}</p>
    </div>
  );
}

function Hero() {
  const { data: stats } = useGetStatsQuery();
  return (
    <section className="relative isolate overflow-hidden bg-slate-950">
      <motion.img
        src={assets.regImage}
        alt=""
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/90" />
      <div className={`${wrap} flex flex-col justify-end pb-10 pt-28 md:min-h-[92dvh] md:pb-16 md:pt-32`}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Instant confirmation · No hidden fees
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            Stay somewhere <span className="italic text-sky-300">worth</span> remembering.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Hand-picked hotels across {stats?.cities || 'the world’s best'} cities. Live availability, clear prices, booked in under two minutes.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="mt-8 md:mt-10">
          <SearchBar />
        </motion.div>
        {stats?.hotels > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-10 grid max-w-2xl grid-cols-3 gap-6">
            <Stat value={stats.hotels} suffix="+" label="Partner hotels" />
            <Stat value={stats.bookings} suffix="+" label="Stays booked" />
            <Stat value={Number(stats.avgRating)} decimals={1} suffix="★" label="Average rating" />
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Destinations() {
  const { data: cities, isLoading } = useGetCitiesQuery();
  if (!isLoading && !cities?.length) return null;
  return (
    <section className={`${wrap} py-16 md:py-24`}>
      <Reveal>
        <SectionHeading
          eyebrow="Trending now"
          title="Popular destinations"
          description="Where travellers are heading this season."
          action={<Button to="/rooms" variant="secondary" size="sm">All stays <ArrowRight className="h-4 w-4" /></Button>}
        />
      </Reveal>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-[70vw] shrink-0 rounded-[28px] sm:w-auto" />)
          : cities?.slice(0, 8).map((c, i) => (
              <Reveal key={c.city} delay={i * 0.05} className="w-[70vw] shrink-0 snap-start sm:w-auto">
                <Link to={`/rooms?destination=${encodeURIComponent(c.city)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[28px]">
                  <img src={imageUrl(c.image)} alt={c.city} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs uppercase tracking-widest text-white/70">{c.country}</p>
                    <h3 className="mt-1 text-2xl font-semibold">{c.city}</h3>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-white/80">{c.hotels} hotel{c.hotels > 1 ? 's' : ''} · from {moneyRound(c.fromPrice)}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-white group-hover:text-slate-900">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
      </div>
    </section>
  );
}

function Featured() {
  const { data: rooms, isLoading } = useGetFeaturedQuery();
  if (!isLoading && !rooms?.length) return null;
  return (
    <section className="bg-surface py-16 md:py-24">
      <div className={wrap}>
        <Reveal>
          <SectionHeading eyebrow="Guest favourites" title="Top-rated rooms" description="Loved by real guests, ranked by real reviews." />
        </Reveal>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <RoomCardSkeleton key={i} />)
            : rooms?.map((room, i) => <RoomCard key={room.id} room={room} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function Offers() {
  const { data: offers, isLoading } = useGetOffersQuery();
  const [copied, setCopied] = useState(null);
  const toast = useToast();

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success(`Code ${code} copied. Apply it at checkout.`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.info(`Your code is ${code}`);
    }
  };

  if (!isLoading && !offers?.length) return null;
  return (
    <section className={`${wrap} py-16 md:py-24`}>
      <Reveal>
        <SectionHeading eyebrow="Limited time" title="Exclusive offers" description="Copy a code and apply it when you book." />
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-[28px]" />)
          : offers.map((o, i) => (
              <Reveal key={o.code} delay={i * 0.08}>
                <div className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-[28px] p-6 text-white">
                  <img src={imageUrl(o.image)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900">{o.percentOff}% OFF</span>
                  <div className="relative">
                    <h3 className="text-2xl font-semibold">{o.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{o.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => copy(o.code)}
                        className="flex items-center gap-2 rounded-full border border-dashed border-white/60 bg-white/10 px-4 py-2 font-mono text-sm font-semibold backdrop-blur transition hover:bg-white/20"
                      >
                        {copied === o.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {o.code}
                      </button>
                      {o.expiresAt && <span className="text-xs text-white/70">Ends {shortDate(o.expiresAt)}</span>}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Search, title: 'Search', text: 'Pick a city and dates. We only show rooms that are actually free.' },
  { icon: BadgeCheck, title: 'Compare', text: 'Real photos, verified reviews and the full price up front.' },
  { icon: CalendarCheck, title: 'Book', text: 'Pay online or at the hotel. Confirmation lands instantly.' },
];

function HowItWorks() {
  return (
    <section className="bg-surface py-16 md:py-24">
      <div className={`${wrap} grid items-center gap-12 lg:grid-cols-2`}>
        <Reveal>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">How it works</p>
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-5xl">From idea to check-in in three taps.</h2>
          <div className="mt-10 space-y-6">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={0.1 * i}>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{i + 1}. {title}</h3>
                    <p className="mt-1 text-sm text-muted">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative">
            <img src={assets.roomImg2} alt="" className="aspect-[4/5] w-full rounded-[32px] object-cover sm:aspect-[5/4] lg:aspect-[4/5]" loading="lazy" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 left-4 right-4 flex items-center gap-4 rounded-3xl border border-line bg-surface/95 p-4 shadow-card backdrop-blur sm:left-auto sm:right-6 sm:w-80"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Booking confirmed</p>
                <p className="text-xs text-muted">Family Suite · 3 nights · QS-8F2A91C</p>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-4 hidden items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 shadow-card sm:flex"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-ink">4.9 guest rating</span>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className={`${wrap} py-16 md:py-24`}>
      <Reveal>
        <SectionHeading eyebrow="Guest stories" title="Travellers keep coming back" />
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.08}>
            <figure className="flex h-full flex-col rounded-[28px] border border-line bg-surface p-6 shadow-card">
              <Stars value={t.rating} />
              <blockquote className="mt-4 flex-1 text-ink">“{t.review}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.image} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.address}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HostCta() {
  return (
    <section className={`${wrap} pb-16 md:pb-24`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand via-blue-700 to-slate-900 px-6 py-12 text-white sm:px-12 md:py-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium"><Building2 className="h-3.5 w-3.5" /> For hotel owners</span>
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-5xl">Run your property on QuickStay.</h2>
              <p className="mt-3 max-w-lg text-white/80">List rooms, take bookings, get paid and track occupancy and revenue from one dashboard. Free to start.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row md:justify-end">
              <Button to="/list-property" variant="secondary" size="lg" className="border-0 bg-white text-slate-900 hover:bg-white/90">
                List your property <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
            {[[Zap, 'Live in 5 minutes'], [ShieldCheck, 'Secure payments'], [CalendarCheck, 'No double bookings']].map(([Icon, t]) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
                <Icon className="h-4 w-4 text-sky-300" /> {t}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribe, { isLoading, isSuccess }] = useSubscribeMutation();
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    try {
      await subscribe(email).unwrap();
      toast.success('You are on the list. Deals incoming!');
      setEmail('');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  return (
    <section className="border-t border-line bg-surface py-16">
      <div className={`${wrap} flex flex-col items-center text-center`}>
        <h2 className="font-display text-3xl font-semibold text-ink">Get member-only deals</h2>
        <p className="mt-2 max-w-md text-muted">One email a month with the best offers. No spam, unsubscribe anytime.</p>
        <form onSubmit={submit} className="mt-6 flex w-full max-w-md gap-2 rounded-full border border-line bg-bg p-1.5 focus-within:ring-4 focus-within:ring-[var(--ring)]">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none" aria-label="Email address" />
          <Button loading={isLoading} size="sm" className="h-10">{isSuccess ? 'Subscribed' : 'Subscribe'}</Button>
        </form>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Destinations />
      <Featured />
      <Offers />
      <HowItWorks />
      <Testimonials />
      <HostCta />
      <Newsletter />
    </>
  );
}
