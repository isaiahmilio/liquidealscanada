import { Routes, Route, Link } from 'react-router-dom';
import { Browse } from './routes/Browse';
import { ListingDetail } from './routes/ListingDetail';
import { Search } from './routes/Search';
import { Login } from './routes/Login';
import { Signup } from './routes/Signup';
import { SellerDashboard } from './routes/seller/Dashboard';
import { NewListing } from './routes/seller/NewListing';
import { EditListing } from './routes/seller/EditListing';
import { RequireSeller } from './components/RequireSeller';
import { useAuth } from './lib/auth';

export function App() {
  const { user, logout } = useAuth();
  const isSeller = user?.role === 'SELLER' || user?.role === 'BOTH';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-brand-700">
            LiquiDealsCanada
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-brand-700">Browse</Link>
            <Link to="/search" className="hover:text-brand-700">Search</Link>
            {user ? (
              <>
                {isSeller && (
                  <>
                    <Link to="/seller" className="hover:text-brand-700">My listings</Link>
                    <Link
                      to="/seller/new"
                      className="bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700"
                    >
                      Sell an item
                    </Link>
                  </>
                )}
                <button onClick={logout} className="text-slate-500 hover:text-slate-900">
                  Sign out
                </button>
                <span className="text-slate-400">{user.email}</span>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-brand-700">Sign in</Link>
                <Link
                  to="/signup"
                  className="bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/seller" element={<RequireSeller><SellerDashboard /></RequireSeller>} />
          <Route path="/seller/new" element={<RequireSeller><NewListing /></RequireSeller>} />
          <Route path="/seller/listings/:id/edit" element={<RequireSeller><EditListing /></RequireSeller>} />
          <Route path="*" element={<p className="text-slate-500">Not found.</p>} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        LiquiDealsCanada &middot; Buy and sell liquidation goods across Canada.
      </footer>
    </div>
  );
}
