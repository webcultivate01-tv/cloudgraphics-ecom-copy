import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { clearCart } from "../features/cart/cartSlice";
import { fetchPendingCount } from "../features/inquiry/inquirySlice";
import { toast } from "react-toastify";

/* ── Inline SVG Icons ──────────────────────────── */
const IC = {
  Dashboard: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Products: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Orders: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Users: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Shield: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Calendar: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Tag: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Home: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  Logout: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Mail: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Menu: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7"/>
      <line x1="4" y1="12" x2="14" y2="12"/>
      <line x1="4" y1="17" x2="20" y2="17"/>
    </svg>
  ),
  Refresh: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,4 23,10 17,10"/>
      <polyline points="1,20 1,14 7,14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Star: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  ),
  Download: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Bell: () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
};

const NAV_LINKS = [
  { to: "/admin/dashboard",  Icon: IC.Dashboard, label: "Dashboard" },
  { to: "/admin/products",   Icon: IC.Products,  label: "Products" },
  { to: "/admin/orders",     Icon: IC.Orders,    label: "Orders" },
  { to: "/admin/users",      Icon: IC.Users,     label: "Users" },
  { to: "/admin/admins",     Icon: IC.Shield,    label: "Admin Management" },
  { to: "/admin/events",     Icon: IC.Calendar,  label: "Events" },
  { to: "/admin/categories", Icon: IC.Tag,       label: "Categories" },
  { to: "/admin/inquiries",  Icon: IC.Mail,      label: "Enquiries",  badge: true },
  { to: "/admin/reviews",       Icon: IC.Star,    label: "Reviews" },
  { to: "/admin/replacements",  Icon: IC.Refresh,   label: "Replacements" },
  { to: "/admin/export",        Icon: IC.Download,  label: "Data Export" },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user }         = useSelector((state) => state.auth);
  const { pendingCount } = useSelector((state) => state.inquiry);

  // Poll pending inquiry count every 60 s so the badge stays fresh
  useEffect(() => {
    dispatch(fetchPendingCount());
    const id = setInterval(() => dispatch(fetchPendingCount()), 60_000);
    return () => clearInterval(id);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = user?.name?.[0]?.toUpperCase() ?? "A";

  return (
    <div className="flex min-h-screen bg-slate-50/80">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside
        className="sidebar-gradient flex flex-col sticky top-0 h-screen shrink-0 overflow-hidden"
        style={{
          width: sidebarOpen ? "260px" : "72px",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-[65px] border-b border-white/[0.06] shrink-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-base leading-none">C</span>
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0 animate-fade-in-up">
              <p className="text-white font-bold text-sm leading-tight truncate">Cloud Graphics</p>
              <p className="text-indigo-400 text-xs truncate">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Toggle sidebar"
          >
            <IC.Menu />
          </button>
        </div>

        {/* User Badge */}
        {user && (
          <div className={`px-3 mt-4 shrink-0 ${!sidebarOpen ? "flex justify-center" : ""}`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] animate-fade-in-up">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate leading-tight">{user.name}</p>
                  <p className="text-indigo-400 text-xs truncate">{user.adminRole || "Admin"}</p>
                </div>
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow"
                title={user.name}
              >
                {initials}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ to, Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-all duration-200 whitespace-nowrap select-none
                 ${!sidebarOpen ? "justify-center" : ""}
                 ${isActive
                   ? "bg-white/10 text-white"
                   : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                 }`
              }
            >
              <span className="shrink-0 relative">
                <Icon />
                {badge && pendingCount > 0 && !sidebarOpen && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </span>
              {sidebarOpen && <span className="flex-1">{label}</span>}
              {sidebarOpen && badge && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom links */}
        <div className={`px-3 py-4 border-t border-white/[0.06] flex flex-col gap-0.5 shrink-0 ${!sidebarOpen ? "" : ""}`}>
          <NavLink
            to="/"
            title={!sidebarOpen ? "Back to Site" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400
                        hover:text-white hover:bg-white/[0.06] transition-all whitespace-nowrap
                        ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <span className="shrink-0"><IC.Home /></span>
            {sidebarOpen && <span>Back to Site</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Logout" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                        text-red-400/80 hover:text-red-300 hover:bg-red-500/10
                        transition-all whitespace-nowrap w-full
                        ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <span className="shrink-0"><IC.Logout /></span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Area ───────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-6 h-[65px] flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Live pulse */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-400 text-xs font-medium hidden sm:block">Online</span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-slate-700 font-semibold text-sm hidden sm:block">Admin Panel</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <NavLink
              to="/admin/inquiries"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title={pendingCount > 0 ? `${pendingCount} pending enquir${pendingCount === 1 ? "y" : "ies"}` : "Enquiries"}
            >
              <IC.Bell />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </NavLink>
            <div className="h-8 w-px bg-slate-100" />
            {/* User info */}
            <div className="text-right hidden sm:block">
              <p className="text-slate-800 text-sm font-semibold leading-tight">{user?.name}</p>
              <p className="text-slate-400 text-xs">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {initials}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              user?.adminRole === "superAdmin"
                ? "bg-amber-100 text-amber-700"
                : "bg-indigo-100 text-indigo-700"
            }`}>
              {user?.adminRole || "Admin"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
