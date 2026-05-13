import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../../features/orders/orderSlice";
import { fetchPaymentStats } from "../../features/payment/paymentSlice";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  Pending:    { cls: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  Processing: { cls: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  Printing:   { cls: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  Shipped:    { cls: "bg-sky-100 text-sky-700",       dot: "bg-sky-400" },
  Delivered:  { cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  Cancelled:  { cls: "bg-red-100 text-red-600",       dot: "bg-red-400" },
};

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
      <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
    </div>
  </div>
);

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.orders);
  const { stats: payStats } = useSelector((state) => state.payment);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchPaymentStats());
  }, [dispatch]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const kpiCards = stats
    ? [
        {
          label: "Total Orders",   value: stats.totalOrders,
          icon: "📦",
          gradient: "from-blue-500 to-indigo-600",
          bg: "bg-blue-50", num: "text-blue-700",
        },
        {
          label: "Total Users",    value: stats.totalUsers,
          icon: "👤",
          gradient: "from-emerald-500 to-teal-600",
          bg: "bg-emerald-50", num: "text-emerald-700",
        },
        {
          label: "Total Products", value: stats.totalProducts,
          icon: "🛍️",
          gradient: "from-amber-500 to-orange-500",
          bg: "bg-amber-50", num: "text-amber-700",
        },
        {
          label: "Total Revenue",  value: `₹${(stats.totalRevenue ?? 0).toLocaleString()}`,
          icon: "💰",
          gradient: "from-violet-500 to-purple-600",
          bg: "bg-violet-50", num: "text-violet-700",
        },
      ]
    : [];

  return (
    <div className="animate-fade-in-up">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-7">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back! Here's today's overview.</p>
        </div>
        <div className="text-xs font-medium text-slate-400 bg-white border border-slate-100 px-3 py-2 rounded-xl shadow-sm">
          📅 {today}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpiCards.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform duration-200`}>
                    {s.icon}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${s.bg} border-2 border-white shadow-sm mt-1`} />
                </div>
                <p className={`text-3xl font-black tracking-tight ${s.num}`}>{s.value}</p>
                <p className="text-slate-400 text-sm mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Payment Overview */}
          {payStats && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-lg">💳</span> Payment Overview
                </h2>
                <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">All time</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Online (Razorpay)", emoji: "🏦",
                    value: payStats.razorpay.total, count: payStats.razorpay.count,
                    cls: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100",
                    val: "text-emerald-700", badge: "bg-emerald-100 text-emerald-600",
                  },
                  {
                    label: "Cash on Delivery", emoji: "💵",
                    value: payStats.cod.total, count: payStats.cod.count,
                    cls: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100",
                    val: "text-amber-700", badge: "bg-amber-100 text-amber-600",
                  },
                  {
                    label: "Refunded Orders", emoji: "↩️",
                    value: payStats.refunded.total, count: payStats.refunded.count,
                    cls: "bg-gradient-to-br from-red-50 to-rose-50 border-red-100",
                    val: "text-red-600", badge: "bg-red-100 text-red-500",
                  },
                ].map((p) => (
                  <div key={p.label} className={`rounded-xl p-4 border ${p.cls}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{p.emoji}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.badge}`}>
                        {p.count} orders
                      </span>
                    </div>
                    <p className={`text-2xl font-black tracking-tight ${p.val}`}>
                      ₹{(p.value ?? 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{p.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Status Breakdown */}
          {stats?.statusCounts && (
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 mb-6">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span> Orders by Status
              </h2>
              <div className="flex flex-wrap gap-3">
                {stats.statusCounts.map((s) => {
                  const cfg = STATUS_CONFIG[s._id] || { cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
                  return (
                    <div key={s._id} className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-center min-w-[80px] hover:shadow-card transition-shadow duration-200">
                      <p className="text-2xl font-black text-slate-800">{s.count}</p>
                      <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {s._id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-lg">⚡</span> Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { to: "/admin/products",   label: "Manage Products",  gradient: "from-indigo-600 to-blue-600",   icon: "🛍️" },
            { to: "/admin/orders",     label: "Manage Orders",    gradient: "from-violet-600 to-purple-600", icon: "📦" },
            { to: "/admin/categories", label: "Manage Categories",gradient: "from-emerald-600 to-teal-600",  icon: "🏷️" },
            { to: "/admin/users",      label: "Manage Users",     gradient: "from-amber-500 to-orange-500",  icon: "👥" },
          ].map(({ to, label, gradient, icon }) => (
            <Link
              key={to}
              to={to}
              className={`bg-gradient-to-r ${gradient} text-white px-5 py-2.5 rounded-xl font-semibold text-sm
                         transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95
                         flex items-center gap-2`}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
