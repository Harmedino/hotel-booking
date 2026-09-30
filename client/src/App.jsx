import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MobileTabBar from './components/layout/MobileTabBar';
import { PageLoader } from './components/layout/PageLoader';
import { RequireAuth, RequireOwner, GuestOnly } from './components/layout/Guards';
import { useTheme } from './hooks/useTheme';
import Home from './pages/Home';

const Rooms = lazy(() => import('./pages/Rooms'));
const RoomDetail = lazy(() => import('./pages/RoomDetail'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const Saved = lazy(() => import('./pages/Saved'));
const Account = lazy(() => import('./pages/Account'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ListProperty = lazy(() => import('./pages/ListProperty'));
const Experience = lazy(() => import('./pages/Experience'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));
const OwnerLayout = lazy(() => import('./pages/owner/OwnerLayout'));
const Dashboard = lazy(() => import('./pages/owner/Dashboard'));
const OwnerRooms = lazy(() => import('./pages/owner/OwnerRooms'));
const RoomForm = lazy(() => import('./pages/owner/RoomForm'));
const OwnerBookings = lazy(() => import('./pages/owner/OwnerBookings'));
const Properties = lazy(() => import('./pages/owner/Properties'));

const TITLES = {
  '/': 'QuickStay · Book stays you will love',
  '/rooms': 'Find a stay · QuickStay',
  '/my-bookings': 'My trips · QuickStay',
  '/saved': 'Saved · QuickStay',
  '/account': 'Account · QuickStay',
  '/login': 'Sign in · QuickStay',
  '/register': 'Create account · QuickStay',
  '/owner': 'Dashboard · QuickStay Host',
};

function ScrollAndTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (TITLES[pathname]) document.title = TITLES[pathname];
  }, [pathname]);
  return null;
}

export default function App() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const isOwnerArea = pathname.startsWith('/owner');
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <ScrollAndTitle />
      {!isOwnerArea && <Navbar theme={theme} toggleTheme={toggle} />}
      <main className="min-h-[70vh]">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
            <Route path="/booking/success" element={<RequireAuth><BookingSuccess /></RequireAuth>} />
            <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><Account theme={theme} toggleTheme={toggle} /></RequireAuth>} />
            <Route path="/list-property" element={<RequireAuth><ListProperty /></RequireAuth>} />
            <Route path="/owner" element={<RequireOwner><OwnerLayout theme={theme} toggleTheme={toggle} /></RequireOwner>}>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<OwnerRooms />} />
              <Route path="rooms/new" element={<RoomForm />} />
              <Route path="rooms/:id/edit" element={<RoomForm />} />
              <Route path="bookings" element={<OwnerBookings />} />
              <Route path="properties" element={<Properties />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isOwnerArea && !isAuthPage && <Footer />}
      {!isOwnerArea && <MobileTabBar />}
    </div>
  );
}
