import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, Search, Heart, CalendarCheck, UserRound, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';

// App-style bottom navigation for phones.
export default function MobileTabBar() {
  const { user } = useAuth();
  const tabs = [
    { to: '/', label: 'Explore', icon: Compass, end: true },
    { to: '/rooms', label: 'Search', icon: Search },
    { to: '/saved', label: 'Saved', icon: Heart },
    { to: '/my-bookings', label: 'Trips', icon: CalendarCheck },
    user?.role === 'owner'
      ? { to: '/owner', label: 'Host', icon: LayoutDashboard }
      : { to: user ? '/account' : '/login', label: user ? 'Profile' : 'Sign in', icon: UserRound },
  ];

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={label} to={to} end={end} className="relative flex flex-col items-center gap-1 py-2.5">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="tab-dot" className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                )}
                <motion.span animate={{ scale: isActive ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                  <Icon className={cn('h-[22px] w-[22px]', isActive ? 'text-brand' : 'text-muted')} strokeWidth={isActive ? 2.4 : 1.8} />
                </motion.span>
                <span className={cn('text-[11px] font-medium', isActive ? 'text-brand' : 'text-muted')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
