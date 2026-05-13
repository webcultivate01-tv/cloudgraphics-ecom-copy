import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders, updateOrderStatus } from "../../features/orders/orderSlice";
import { markOrderRefunded } from "../../features/payment/paymentSlice";
import { toast } from "react-toastify";
import api from "../../utils/api";

const STATUSES = ["Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"];

const STATUS_CFG = {
  Pending:    { cls: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  Processing: { cls: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  Printing:   { cls: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  Shipped:    { cls: "bg-sky-100 text-sky-700",       dot: "bg-sky-400" },
  Delivered:  { cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  Cancelled:  { cls: "bg-red-100 text-red-600",       dot: "bg-red-400" },
};

const DATE_FILTERS = [
  { label: "All",        value: "" },
  { label: "Today",      value: "today" },
  { label: "Last 3 Days",value: "3days" },
  { label: "Last 7 Days",value: "7days" },
  { label: "Last 30 Days",value: "30days" },
  { label: "Custom",     value: "custom" },
];

export default function ManageOrders() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  const [dateFilter, setDateFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [shipForm, setShipForm] = useState({ state: "Maharashtra", length: 10, breadth: 10, height: 5, weight: 0.5 });
  const [refunding, setRefunding] = useState(null);
  const [cancellingShipment, setCancellingShipment] = useState(null);
  const [trackingModal, setTrackingModal] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const loadOrders = () => {
    const params = {};
    if (dateFilter && dateFilter !== "custom") params.filter = dateFilter;
    if (dateFilter === "custom" && fromDate)   params.from = fromDate;
    if (dateFilter === "custom" && toDate)     params.to   = toDate;
    if (statusFilter)                          params.status = statusFilter;
    dispatch(fetchAllOrders(params));
  };

  useEffect(() => { loadOrders(); }, [dateFilter, statusFilter, fromDate, toDate]);

  const handleStatusChange = async (orderId, status) => {
    const result = await dispatch(updateOrderStatus({ id: orderId, status }));
    if (!result.error) toast.success(`Status updated to "${status}"`);
    else toast.error("Failed to update status");
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm("Mark this order as refunded and cancel it?")) return;
    setRefunding(orderId);
    const result = await dispatch(markOrderRefunded(orderId));
    setRefunding(null);
    if (!result.error) { toast.success("Order marked as refunded"); loadOrders(); }
    else toast.error("Refund failed");
  };

  const handleShipOrder = async (orderId) => {
    try {
      const { data } = await api.post(`/shipment/${orderId}`, shipForm);
      if (data.pickupScheduled) {
        toast.success(`✅ Shipped & pickup scheduled! AWB: ${data.shipment.trackingId || "Pending"}`);
      } else {
        toast.warn(`Order created on Shiprocket but pickup needs manual confirmation. AWB: ${data.shipment.trackingId || "Pending"}`);
      }
      setShippingOrderId(null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Shiprocket error. Check credentials in .env");
    }
  };

  const handleCancelShipment = async (orderId) => {
    if (!window.confirm("Cancel this shipment on Shiprocket? The order will go back to Processing status.")) return;
    setCancellingShipment(orderId);
    try {
      const { data } = await api.post(`/shipment/${orderId}/cancel`);
      toast.success(data.message);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel shipment");
    } finally {
      setCancellingShipment(null);
    }
  };

  const handleTrackShipment = async (order) => {
    setTrackingModal(order);
    setTrackingData(null);
    setLoadingTracking(true);
    try {
      const { data } = await api.get(`/shipment/${order._id}`);
      setTrackingData(data);
    } catch (err) {
      toast.error("Failed to fetch tracking info");
      setTrackingModal(null);
    } finally {
      setLoadingTracking(false);
    }
  };

  return (
    <div className="animate-fade-in-up">

      {/* ── Live Tracking Modal ─────────────────────────────── */}
      {trackingModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-black text-slate-800 text-base">🚚 Live Shipment Tracking</h2>
                <p className="text-slate-400 text-xs mt-0.5">Order #{trackingModal._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => { setTrackingModal(null); setTrackingData(null); }}
                className="text-slate-400 hover:text-slate-700 bg-transparent border-none text-xl font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6">
              {loadingTracking ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">Fetching live tracking from Shiprocket…</p>
                </div>
              ) : trackingData ? (
                <>
                  {/* Shipment summary */}
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Courier</p>
                        <p className="font-bold text-slate-800 text-sm">{trackingData.shipment?.courierName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AWB Number</p>
                        <p className="font-mono font-bold text-indigo-600 text-sm">{trackingData.shipment?.trackingId || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shipped On</p>
                        <p className="font-semibold text-slate-700 text-sm">
                          {trackingData.shipment?.shippedAt
                            ? new Date(trackingData.shipment.shippedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          STATUS_CFG[trackingData.status]?.cls || "bg-slate-100 text-slate-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[trackingData.status]?.dot || "bg-slate-400"}`} />
                          {trackingData.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live tracking events from Shiprocket */}
                  {trackingData.liveTracking ? (
                    <>
                      {/* Current status highlight */}
                      {trackingData.liveTracking.shipment_track?.[0] && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Current Status</p>
                          <p className="font-bold text-emerald-800 text-sm">
                            {trackingData.liveTracking.shipment_track[0].current_status || "In Transit"}
                          </p>
                          {trackingData.liveTracking.shipment_track[0].delivered_date && (
                            <p className="text-emerald-600 text-xs mt-1">
                              Delivered: {trackingData.liveTracking.shipment_track[0].delivered_date}
                            </p>
                          )}
                          {trackingData.liveTracking.shipment_track[0].etd && (
                            <p className="text-emerald-600 text-xs mt-1">
                              Expected Delivery: {trackingData.liveTracking.shipment_track[0].etd}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Tracking activity timeline */}
                      {trackingData.liveTracking.shipment_track_activities?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Tracking Timeline</p>
                          <div className="flex flex-col gap-0 relative">
                            {/* Vertical line */}
                            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-200" />
                            {trackingData.liveTracking.shipment_track_activities.map((activity, i) => (
                              <div key={i} className="flex gap-3 pb-4 relative">
                                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center z-10 mt-0.5 ${
                                  i === 0 ? "bg-indigo-600" : "bg-slate-200"
                                }`}>
                                  <span className={`text-[9px] font-bold ${
                                    i === 0 ? "text-white" : "text-slate-500"
                                  }`}>{i === 0 ? "●" : "○"}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold ${
                                    i === 0 ? "text-indigo-700" : "text-slate-700"
                                  }`}>
                                    {activity["sr-status-label"] || activity.activity || "Update"}
                                  </p>
                                  {activity.location && (
                                    <p className="text-xs text-slate-500 mt-0.5">📍 {activity.location}</p>
                                  )}
                                  {activity.date && (
                                    <p className="text-xs text-slate-400 mt-0.5">🕐 {activity.date}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* No live data yet — show pickup status info */
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="font-bold text-amber-700 text-sm mb-2">⏳ Pickup Pending</p>
                      <p className="text-amber-600 text-xs leading-relaxed">
                        The shipment has been created and pickup is scheduled. Live tracking will be available once the courier partner scans the parcel at pickup.
                      </p>
                      <div className="mt-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">✓</span>
                          <span className="text-xs text-slate-600 font-medium">Order created on Shiprocket</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">✓</span>
                          <span className="text-xs text-slate-600 font-medium">AWB assigned — {trackingData.shipment?.courierName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">✓</span>
                          <span className="text-xs text-slate-600 font-medium">Pickup scheduled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-[9px] font-bold shrink-0">○</span>
                          <span className="text-xs text-slate-400">Waiting for courier to collect parcel…</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-[9px] font-bold shrink-0">○</span>
                          <span className="text-xs text-slate-400">In transit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-[9px] font-bold shrink-0">○</span>
                          <span className="text-xs text-slate-400">Delivered to customer</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* External track link */}
                  {trackingData.shipment?.trackingId && (
                    <a
                      href={`https://shiprocket.co/tracking/${trackingData.shipment.trackingId}`}
                      target="_blank" rel="noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      🔗 Open Full Tracking on Shiprocket ↗
                    </a>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">All Orders</h1>
          <p className="text-slate-400 text-sm mt-0.5">{orders.length} orders found</p>
        </div>
        <button onClick={loadOrders} className="admin-btn admin-btn-ghost text-xs">
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 mb-5">
        {/* Date pill filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {DATE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDateFilter(value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                dateFilter === value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {dateFilter === "custom" && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <input type="date" className="admin-input !w-auto" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <span className="text-slate-400 text-sm font-medium">→</span>
            <input type="date" className="admin-input !w-auto" value={toDate}   onChange={(e) => setToDate(e.target.value)} />
          </div>
        )}

        {/* Status filter */}
        <select
          className="admin-input !w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-card p-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 font-medium">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const cfg = STATUS_CFG[order.status] || { cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
            return (
              <div key={order._id} className="admin-card hover:shadow-card-hover transition-shadow duration-200">
                {/* Card top stripe by status */}
                <div className={`h-1 w-full ${cfg.dot} rounded-t-2xl`} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex justify-between flex-wrap gap-2 mb-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-0.5">Order ID</p>
                      <p className="font-mono text-sm text-slate-700 font-semibold">{order._id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </p>
                      <p className="font-black text-slate-900 text-lg">₹{order.totalPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {order.user?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{order.user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{order.user?.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        📞 {order.shippingAddress?.phone} &nbsp;·&nbsp;
                        📍 {order.shippingAddress?.address}, {order.shippingAddress?.city} — {order.shippingAddress?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Payment badge */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className={`status-badge ${
                      order.paymentStatus === "paid"     ? "bg-emerald-100 text-emerald-700" :
                      order.paymentStatus === "refunded" ? "bg-red-100 text-red-600"         :
                                                           "bg-amber-100 text-amber-700"
                    }`}>
                      {order.paymentMethod === "razorpay" ? "💳 Razorpay" : "💵 COD"}
                      {" · "}{order.paymentStatus?.toUpperCase()}
                    </span>
                    {order.razorpayPaymentId && (
                      <span className="text-xs text-slate-400 font-mono">
                        ID: <span className="text-indigo-500">{order.razorpayPaymentId}</span>
                      </span>
                    )}
                  </div>

                  {/* Items */}
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400">Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                        {item.uploadedImage ? (
                          <a
                            href={item.uploadedImage} target="_blank" rel="noreferrer"
                            className="text-xs border border-emerald-200 text-emerald-600 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                          >
                            View Design ↗
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">No custom image</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.customerNote && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-3">
                      <span className="mt-0.5">📝</span>
                      <span>{order.customerNote}</span>
                    </div>
                  )}

                  {order.shipment?.trackingId && (
                    <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-sky-700 mb-3">
                      <span>🚚</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{order.shipment.courierName || "Courier Assigned"}</p>
                        <p className="text-xs mt-0.5">AWB: <code className="font-mono">{order.shipment.trackingId}</code></p>
                        {order.shipment.shippedAt && (
                          <p className="text-xs text-sky-400 mt-0.5">
                            Shipped: {new Date(order.shipment.shippedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {/* Live Track button */}
                        <button
                          onClick={() => handleTrackShipment(order)}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors border-none cursor-pointer"
                        >
                          📍 Track Live
                        </button>
                        {/* Cancel shipment — only before delivery */}
                        {order.status === "Shipped" && (
                          <button
                            disabled={cancellingShipment === order._id}
                            onClick={() => handleCancelShipment(order._id)}
                            className="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors font-semibold shrink-0 disabled:opacity-50"
                          >
                            {cancellingShipment === order._id ? "Cancelling…" : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom action row */}
                  <div className="flex flex-wrap gap-3 items-start pt-3 border-t border-slate-100">
                    {/* Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`status-badge ${cfg.cls} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {order.status}
                      </span>

                      {/* If cancelled by user — show locked badge, no dropdown */}
                      {order.cancelledBy === "user" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                          🔒 Cancelled by Customer — Cannot Edit
                        </span>
                      ) : order.status === "Cancelled" ? (
                        // Admin-cancelled — also locked (no point re-editing)
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
                          🔒 Cancelled by Admin
                        </span>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="admin-input !w-auto !py-1.5 !text-xs"
                        >
                          {STATUSES.filter((s) => s !== "Cancelled" || order.status === "Cancelled").map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Refund */}
                    {order.paymentMethod === "razorpay" && order.paymentStatus === "paid" && order.status !== "Cancelled" && (
                      <button
                        disabled={refunding === order._id}
                        onClick={() => handleRefund(order._id)}
                        className="admin-btn admin-btn-danger !py-1.5 !text-xs disabled:opacity-50"
                      >
                        {refunding === order._id ? "Processing…" : "↩ Mark Refunded"}
                      </button>
                    )}

                    {/* Shiprocket */}
                    {!order.shipment?.trackingId && order.status !== "Cancelled" && (
                      shippingOrderId === order._id ? (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 w-full mt-1">
                          <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1.5">
                            📦 Shipment Details (Shiprocket)
                          </p>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700 leading-relaxed">
                            ⚠️ <strong>Important:</strong> Ensure your pickup address is configured in Shiprocket Dashboard → Settings → Manage Pickup Addresses. The delivery boy will come to collect the parcel from this address.
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">State *</label>
                              <input type="text" placeholder="Maharashtra" value={shipForm.state}
                                onChange={(e) => setShipForm({ ...shipForm, state: e.target.value })}
                                className="admin-input !py-1.5 !text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Length (cm) *</label>
                              <input type="number" placeholder="10" value={shipForm.length}
                                onChange={(e) => setShipForm({ ...shipForm, length: e.target.value })}
                                className="admin-input !py-1.5 !text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Breadth (cm) *</label>
                              <input type="number" placeholder="10" value={shipForm.breadth}
                                onChange={(e) => setShipForm({ ...shipForm, breadth: e.target.value })}
                                className="admin-input !py-1.5 !text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Height (cm) *</label>
                              <input type="number" placeholder="5" value={shipForm.height}
                                onChange={(e) => setShipForm({ ...shipForm, height: e.target.value })}
                                className="admin-input !py-1.5 !text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Weight (kg) *</label>
                              <input type="number" step="0.1" placeholder="0.5" value={shipForm.weight}
                                onChange={(e) => setShipForm({ ...shipForm, weight: e.target.value })}
                                className="admin-input !py-1.5 !text-xs" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleShipOrder(order._id)} className="admin-btn admin-btn-success !py-2 !text-xs">
                              ✅ Confirm & Ship — Schedule Pickup
                            </button>
                            <button onClick={() => setShippingOrderId(null)} className="admin-btn admin-btn-ghost !py-2 !text-xs">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShippingOrderId(order._id)}
                          className="admin-btn bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 !py-1.5 !text-xs"
                        >
                          🚚 Ship via Shiprocket
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
