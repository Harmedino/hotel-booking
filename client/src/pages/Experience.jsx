import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { assets } from '../assets/assets';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { Reveal } from '../components/ui/misc';

const EXPERIENCES = [
  { title: 'Luxury stays', text: 'World-class rooms with premium amenities and views worth waking up for.', image: assets.roomImg4, query: 'roomType=Luxury Room', features: ['Signature rooms', 'Pool access', 'Room service'] },
  { title: 'City breaks', text: 'Central, design-led hotels close to the best food, culture and nightlife.', image: assets.roomImg1, query: 'destination=New York', features: ['Walkable locations', 'Fast Wi-Fi', 'Late check-out'] },
  { title: 'Business travel', text: 'Quiet rooms, reliable Wi-Fi and flexible check-in for work trips.', image: assets.roomImg2, query: 'amenities=Free WiFi', features: ['Work desks', 'Free Wi-Fi', 'Airport access'] },
  { title: 'Family getaways', text: 'Spacious suites with room for everyone and pools the kids will love.', image: assets.roomImg3, query: 'roomType=Family Suite', features: ['Up to 4 guests', 'Free breakfast', 'Pool access'] },
];

export default function Experience() {
  return (
    <PageShell>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Experiences</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-6xl">Every kind of trip, done right.</h1>
        <p className="mt-4 text-lg text-muted">Pick the kind of stay you're after. We'll take you straight to rooms that fit.</p>
      </div>
      <div className="mt-14 space-y-16 md:space-y-24">
        {EXPERIENCES.map((e, i) => (
          <Reveal key={e.title}>
            <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <Link to={`/rooms?${e.query}`} className="group block overflow-hidden rounded-[32px]">
                <img src={e.image} alt={e.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
              </Link>
              <div>
                <span className="font-display text-6xl text-line">0{i + 1}</span>
                <h2 className="mt-2 text-3xl font-semibold text-ink">{e.title}</h2>
                <p className="mt-3 text-muted">{e.text}</p>
                <ul className="mt-6 space-y-2">
                  {e.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-ink"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand"><Check className="h-3.5 w-3.5" /></span>{f}</li>
                  ))}
                </ul>
                <Button to={`/rooms?${e.query}`} variant="secondary" className="mt-8">Explore {e.title.toLowerCase()} <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
