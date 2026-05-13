import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { clearCart, selectCartCount } from "../features/cart/cartSlice";
import { selectFavoriteCount } from "../features/favorites/favoritesSlice";
import { toast } from "react-toastify";

const CATEGORIES = ["Sale", "New Arrivals", "Cup", "T-Shirt", "Diary", "Pen", "ID Card", "Frame", "Keychain"];
const OFFERS = [
  "Get EXTRA 10% OFF On Orders Above ₹499 | Code: CG10",
  "Free Delivery On All Orders Above ₹299",
  "Get EXTRA 15% OFF On Orders Above ₹999 | Code: CG15",
  "Custom Printing On All Products — Upload Your Design!",
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const cartCount = useSelector(selectCartCount);
  const favCount = useSelector(selectFavoriteCount);

  const [offerIndex, setOfferIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setOfferIndex((i) => (i + 1) % OFFERS.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setMobileDrawer(false); setMenuOpen(false); }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileDrawer) return;
    const handler = (e) => { if (drawerRef.current && !drawerRef.current.contains(e.target)) setMobileDrawer(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileDrawer]);

  const handleLogout = () => {
    dispatch(logout()); dispatch(clearCart());
    toast.success("Logged out successfully"); navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false); setSearchQuery("");
    }
  };

  const catQuery = (cat) => cat === "Sale" ? "?sale=true" : cat === "New Arrivals" ? "?sort=newest" : `?category=${cat}`;
  const catActive = (cat) => location.search.includes(cat) || (cat === "Sale" && location.search.includes("sale"));

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Offer Bar */}
      <div className="bg-red-700 py-2 px-4 text-center">
        <p className="text-white text-xs font-medium tracking-wide transition-all duration-300">{OFFERS[offerIndex]}</p>
      </div>

      {/* Main Nav */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-gray-200">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          {/* Hamburger — mobile only */}
          <button className="md:hidden flex flex-col items-center justify-center p-1 text-gray-700" onClick={() => setMobileDrawer(true)} aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Search — desktop */}
          <div className="hidden md:flex items-center">
            {!searchOpen ? (
              <button onClick={() => setSearchOpen(true)} className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-700 transition-colors p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span className="text-[10px] text-gray-500 font-medium">Search</span>
              </button>
            ) : (
              <form onSubmit={handleSearch} className="flex items-center gap-1.5">
                <input autoFocus className="border-2 border-red-700 rounded px-3 py-1.5 text-sm w-56 outline-none" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button type="submit" className="bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-red-800">Go</button>
                <button type="button" className="bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-gray-500" onClick={() => setSearchOpen(false)}>✕</button>
              </form>
            )}
          </div>
        </div>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="text-3xl">🖨️</span>
          <div>
            <span className="block text-red-700 text-lg md:text-xl font-black tracking-widest leading-none">CLOUD GRAPHICS</span>
            <span className="block text-gray-400 text-[9px] tracking-[4px] hidden sm:block">AMRAVATI</span>
          </div>
        </Link>

        {/* Right Icons */}
        <div className="flex items-center gap-3 md:gap-5 flex-1 justify-end">
          {user && (
            <Link to="/orders" className="hidden md:flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-700 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <polyline points="16 3 12 7 8 3"/>
              </svg>
              <span className="text-[10px] text-gray-500 font-medium">Orders</span>
            </Link>
          )}

          <Link to="/favorites" className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-700 transition-colors relative">
            <div className="relative">
              <span className="text-xl leading-none">🤍</span>
              {favCount > 0 && <span className="absolute -top-1.5 -right-2 bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">{favCount}</span>}
            </div>
            <span className="text-[10px] text-gray-500 font-medium hidden md:block">Saved</span>
          </Link>

          <Link to="/cart" className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-700 transition-colors">
            <div className="relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && <span className="absolute -top-1.5 -right-2 bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">{cartCount}</span>}
            </div>
            <span className="text-[10px] text-gray-500 font-medium hidden md:block">Cart</span>
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-xs">{user.name?.[0]?.toUpperCase()}</div>
                <span className="text-[10px] text-gray-500 font-medium hidden md:block">{user.name.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[170px] z-50 overflow-hidden">
                  {user.role === "admin" && (
                    <Link to="/admin/dashboard" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>🛠️ Admin Panel</Link>
                  )}
                  <Link to="/profile" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                  <Link to="/favorites" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>❤️ My Favourites</Link>
                  <Link to="/replacements" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>🔄 My Replacements</Link>
                  <Link to="/orders" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors" onClick={() => setMenuOpen(false)}>📦 My Orders</Link>
                  <button className="block w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors border-t border-gray-100" onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-700 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-[10px] text-gray-500 font-medium hidden md:block">Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Category Nav — desktop */}
      <nav className="hidden md:block bg-white border-t border-gray-200">
        <div className="flex overflow-x-auto px-8">
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/products${catQuery(cat)}`}
              className={`inline-block px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap border-b-2 transition-all duration-200 ${catActive(cat) ? "text-red-700 border-red-700" : "text-gray-600 border-transparent hover:text-red-700"}`}>
              {cat.toUpperCase()}
            </Link>
          ))}
          <Link to="/contact"
            className={`inline-block px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap border-b-2 transition-all duration-200 ${location.pathname === "/contact" ? "text-red-700 border-red-700" : "text-gray-600 border-transparent hover:text-red-700"}`}>
            CONTACT US
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileDrawer && (
        <div className="fixed inset-0 bg-black/50 z-[500]" onClick={() => setMobileDrawer(false)}>
          <div ref={drawerRef} className="absolute top-0 left-0 bottom-0 w-72 bg-white overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100">
              <span className="font-black text-red-700 tracking-widest text-sm">CLOUD GRAPHICS</span>
              <button className="text-gray-400 hover:text-gray-700 text-lg font-bold" onClick={() => setMobileDrawer(false)}>✕</button>
            </div>

            {/* Mobile search */}
            <form onSubmit={handleSearch} className="px-4 py-3 border-b border-gray-100">
              <div className="flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-700" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button type="submit" className="bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold">Go</button>
              </div>
            </form>

            <div className="py-2 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-4 py-2">Categories</p>
              {CATEGORIES.map((cat) => (
                <Link key={cat} to={`/products${catQuery(cat)}`} className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">{cat}</Link>
              ))}
              <Link to="/contact" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">Contact Us</Link>
            </div>

            <div className="py-2">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-4 py-2">Account</p>
              {user ? (
                <>
                  {user.role === "admin" && <Link to="/admin/dashboard" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">🛠️ Admin Panel</Link>}
                  <Link to="/profile" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">👤 My Profile</Link>
                  <Link to="/orders" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">📦 My Orders</Link>
                  <Link to="/favorites" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">❤️ My Favourites</Link>
                  <Link to="/replacements" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">🔄 My Replacements</Link>
                  <button className="block w-full text-left px-4 py-2.5 text-sm text-red-700 font-semibold hover:bg-red-50 transition-colors" onClick={handleLogout}>🚪 Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">Sign In</Link>
                  <Link to="/register" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-red-50 hover:text-red-700 transition-colors">Create Account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
