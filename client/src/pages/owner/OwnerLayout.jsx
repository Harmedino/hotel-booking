import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutDashboard, BedDouble, CalendarRange, Building2, ArrowLeft, LogOut, Plus } from 'lucide-react';
import { assets } from '../../assets/assets';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../store/authSlice';
import { Avatar } from '../../components/ui/misc';
import { ThemeToggle } from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/cn';

const NAV = [
  { to: '/owner', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/owner/bookings', label: 'Bookings', icon: CalendarRange },
  { to: '/owner/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/owner/properties', label: 'Properties', icon: Building2 },
];

export default function OwnerLayout({ theme, toggleTheme }) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface p-4 lg:flex">
        <Link to="/owner" className="flex items-center gap-2 px-3 py-2">
          <img src={assets.logo} alt="QuickStay" className="h-7 brightness-0 dark:brightness-100" />
          <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">Host</span>
        </Link>
        <Button to="/owner/rooms/new" className="mt-6 w-full"><Plus className="h-4 w-4" /> Add room</Button>
        <nav className="mt-6 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition', isActive ? 'text-brand' : 'text-muted hover:bg-surface-2 hover:text-ink')}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="owner-nav" className="absolute inset-0 rounded-2xl bg-brand-soft" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <Icon className="relative h-[18px] w-[18px]" />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-1">
          <Link to="/" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to site</Link>
          <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
            <Avatar name={user.name} src={user.avatarUrl} className="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <button onClick={() => dispatch(logout())} className="text-muted hover:text-rose-500" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/85 px-4 py-3 backdrop-blur-xl lg:pl-72 lg:pr-8">
        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <img src={assets.logo} alt="QuickStay" className="h-7 brightness-0 dark:brightness-100" />
          <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">Host</span>
        </Link>
        <p className="hidden text-sm text-muted lg:block">Welcome back, <span className="font-semibold text-ink">{user.name.split(' ')[0]}</span></p>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <Link to="/account" className="lg:hidden"><Avatar name={user.name} src={user.avatarUrl} className="h-9 w-9 text-xs" /></Link>
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pl-72 lg:pr-8">
        <AnimatePresence mode="wait">
          <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-6xl">
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl lg:hidden">
        {NAV.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', isActive ? 'text-brand' : 'text-muted')}>
            <Icon className="h-[22px] w-[22px]" /> {label}
          </NavLink>
        ))}
        <Link to="/owner/rooms/new" className="flex items-center justify-center" aria-label="Add room">
          <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-8px_var(--brand)]"><Plus className="h-6 w-6" /></span>
        </Link>
        {NAV.slice(2).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', isActive ? 'text-brand' : 'text-muted')}>
            <Icon className="h-[22px] w-[22px]" /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function OwnerHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
