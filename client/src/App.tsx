import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Browse } from './routes/Browse';
import { ListingDetail } from './routes/ListingDetail';
import { Search } from './routes/Search';
import { Login } from './routes/Login';
import { Signup } from './routes/Signup';
import { SellerDashboard } from './routes/seller/Dashboard';
import { NewListing } from './routes/seller/NewListing';
import { EditListing } from './routes/seller/EditListing';
import { RequireSeller } from './components/RequireSeller';
import { Favorites } from './routes/Favorites';
import { useAuth } from './lib/auth';

const TICKER_ITEMS = [
  '🍁 New deals added daily',
  '💰 Up to 90% off retail',
  '🇨🇦 Canadian sellers',
  '🏷️ Liquidation prices',
  '📦 Electronics, Kitchen, Gaming & more',
  '🍁 New deals added daily',
  '💰 Up to 90% off retail',
  '🇨🇦 Canadian sellers',
  '🏷️ Liquidation prices',
  '📦 Electronics, Kitchen, Gaming & more',
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-maple-500' : 'text-slate-600 hover:text-slate-900'
  }`;

export function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSeller = user?.role === 'SELLER' || user?.role === 'BOTH';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Scrolling ticker */}
      <div className="bg-maple-500 text-white text-xs font-medium py-1.5 overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee gap-0">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="px-8">{item}</span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xl">🍁</span>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-maple-500">LiquiDeals</span>
              <span className="text-slate-800">Canada</span>
            </span>
          </Link>

          <nav className="flex items-center gap-5">
            <NavLink to="/" end className={navLinkClass}>Browse</NavLink>
            <NavLink to="/search" className={navLinkClass}>Search</NavLink>
            {user && (
              <NavLink to="/saved" className={navLinkClass}>
                Saved
              </NavLink>
            )}
            {isSeller && (
              <NavLink to="/seller" className={navLinkClass}>My Listings</NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              <>
                {isSeller && (
                  <Link
                    to="/seller/new"
                    className="hidden sm:inline-flex items-center gap-1.5 bg-maple-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-maple-600 active:scale-95 transition shadow-sm"
                  >
                    + Sell item
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <span className="hidden md:block text-xs text-slate-400 max-w-[140px] truncate">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="bg-maple-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-maple-600 active:scale-95 transition shadow-sm"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main key={location.pathname} className="flex-1 w-full animate-page-enter pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/search" element={
            <div className="max-w-6xl mx-auto px-4 py-8"><Search /></div>
          } />
          <Route path="/listings/:id" element={
            <div className="max-w-6xl mx-auto px-4 py-8"><ListingDetail /></div>
          } />
          <Route path="/saved" element={
            <div className="max-w-6xl mx-auto px-4 py-8"><Favorites /></div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/seller" element={
            <div className="max-w-6xl mx-auto px-4 py-8">
              <RequireSeller><SellerDashboard /></RequireSeller>
            </div>
          } />
          <Route path="/seller/new" element={
            <div className="max-w-6xl mx-auto px-4 py-8">
              <RequireSeller><NewListing /></RequireSeller>
            </div>
          } />
          <Route path="/seller/listings/:id/edit" element={
            <div className="max-w-6xl mx-auto px-4 py-8">
              <RequireSeller><EditListing /></RequireSeller>
            </div>
          } />
          <Route path="*" element={
            <div className="max-w-6xl mx-auto px-4 py-8"><NotFound /></div>
          } />
        </Routes>
      </main>

      <BackToTop />
      <MobileNav />

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center gap-1.5">
              <span>🍁</span>
              <span className="font-bold text-slate-800">LiquiDealsCanada</span>
            </div>
            <p className="text-sm text-slate-500">Buy liquidation goods for up to 90% off</p>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link to="/" className="hover:text-maple-500 transition-colors">Browse</Link>
            <Link to="/search" className="hover:text-maple-500 transition-colors">Search</Link>
          </div>
        </div>
        <div className="border-t border-slate-100 py-3 text-center text-xs text-slate-400">
          🇨🇦 Proudly serving Canadians from coast to coast
        </div>
      </footer>
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 400); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-10 h-10 rounded-full bg-maple-500 text-white shadow-lg flex items-center justify-center hover:bg-maple-600 active:scale-95 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      ↑
    </button>
  );
}

function MobileNav() {
  const { user } = useAuth();
  const isSeller = user?.role === 'SELLER' || user?.role === 'BOTH';

  const tab = (to: string, end: boolean, label: string, icon: React.ReactNode) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors ${
          isActive ? 'text-maple-500' : 'text-slate-400'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-slate-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] flex items-center justify-around h-16">
      {tab('/', true, 'Browse',
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
      )}
      {tab('/search', false, 'Search',
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      )}
      {user
        ? tab('/saved', false, 'Saved',
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          )
        : tab('/login', false, 'Sign in',
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          )
      }
      {isSeller && tab('/seller/new', false, 'Sell',
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4"/></svg>
      )}
    </nav>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="bg-maple-500 text-white px-5 py-2.5 rounded-lg hover:bg-maple-600 font-medium transition active:scale-95 shadow-sm"
      >
        Go back
      </button>
    </div>
  );
}
