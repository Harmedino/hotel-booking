import { Link } from 'react-router-dom';
import { assets } from '../../assets/assets';

const COLUMNS = [
  { title: 'Explore', links: [['Find stays', '/rooms'], ['Experiences', '/experience'], ['About us', '/about']] },
  { title: 'Your account', links: [['My trips', '/my-bookings'], ['Saved stays', '/saved'], ['Account', '/account']] },
  { title: 'Hosts', links: [['List your property', '/list-property'], ['Owner dashboard', '/owner']] },
];

export default function Footer() {
  return (
    <footer className="no-print border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-14 sm:px-6 md:pb-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <img src={assets.logo} alt="QuickStay" className="h-8 brightness-0 dark:brightness-100" />
            <p className="mt-4 text-sm leading-6 text-muted">
              Book design-forward hotels in minutes. Real availability, clear prices, instant confirmation.
            </p>
            <div className="mt-5 flex gap-3">
              {[assets.instagramIcon, assets.facebookIcon, assets.twitterIcon, assets.linkendinIcon].map((icon, i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full border border-line">
                  <img src={icon} alt="" className="h-4 opacity-70 dark:invert" />
                </span>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-ink">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-muted transition hover:text-brand">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} QuickStay. All rights reserved.</p>
          <p>Prices in USD · Taxes shown before you book</p>
        </div>
      </div>
    </footer>
  );
}
