import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun, CalendarCheck, Heart, UserRound, LayoutDashboard, LogOut, Building2, ChevronDown } from 'lucide-react';
import { assets } from '../../assets/assets';
import { useAuth } from '../../hooks/useAuth';
import { useSignOut } from '../../hooks/useSignOut';
import { Avatar } from '../ui/misc';
import Button from '../ui/Button';
import { cn } from '../../lib/cn';

const LINKS = [
  { name: 'Home', to: '/' },
  { name: 'Stays', to: '/rooms' },
  { name: 'Experience', to: '/experience' },
  { name: 'About', to: '/about' },
];

export function ThemeToggle({ theme, toggle, className }) {
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={cn('relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-ink transition hover:bg-surface-2', className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: -20, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: 20, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const signOut = useSignOut();
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const items = [
    user.role === 'owner'
      ? { to: '/owner', label: 'Owner dashboard', icon: LayoutDashboard }
      : { to: '/list-property', label: 'List your property', icon: Building2 },
    { to: '/my-bookings', label: 'My trips', icon: CalendarCheck },
    { to: '/saved', label: 'Saved stays', icon: Heart },
    { to: '/account', label: 'Account', icon: UserRound },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition hover:shadow-card"
        aria-expanded={open}
      >
        <Avatar name={user.name} src={user.avatarUrl} className="h-8 w-8 text-xs" />
        <span className="max-w-28 truncate text-sm font-medium text-ink">{user.name.split(' ')[0]}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted transition', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-card"
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            {items.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover:bg-surface-2">
                <Icon className="h-4 w-4 text-muted" /> {label}
              </Link>
            ))}
            <div className="my-1 h-px bg-line" />
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-500 transition hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar({ theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const overHero = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'no-print fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-line bg-surface/80 py-2.5 backdrop-blur-xl' : 'py-4'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={assets.logo} alt="" className={cn('h-8 transition', overHero ? '' : 'brightness-0 dark:brightness-100')} />
          <span className={cn('sr-only')}>QuickStay</span>
        </Link>

        <nav className={cn('hidden items-center gap-1 rounded-full p-1 md:flex', overHero ? 'bg-white/10 backdrop-blur-md' : 'bg-surface-2/70')}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-full px-4 py-1.5 text-sm font-medium transition',
                  overHero ? 'text-white/85 hover:text-white' : 'text-muted hover:text-ink',
                  isActive && (overHero ? 'text-white' : 'text-ink')
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className={cn('absolute inset-0 rounded-full', overHero ? 'bg-white/20' : 'bg-surface shadow-card')}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{l.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} toggle={toggleTheme} className={overHero ? 'border-white/25 bg-white/10 text-white hover:bg-white/20' : ''} />
          {loading ? (
            <div className="skeleton h-10 w-28 rounded-full" />
          ) : user ? (
            <div className="hidden md:block">
              <UserMenu key={pathname} user={user} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className={cn('px-3 text-sm font-medium', overHero ? 'text-white' : 'text-ink')}>
                Sign in
              </Link>
              <Button to="/register" size="sm">Get started</Button>
            </div>
          )}
          {!loading && user && (
            <Link to="/account" className="md:hidden" aria-label="Account">
              <Avatar name={user.name} src={user.avatarUrl} className="h-9 w-9 text-xs" />
            </Link>
          )}
          {!loading && !user && (
            <Button to="/login" size="sm" className="md:hidden">Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
}
