import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders, requestCancelOTP, cancelOrder } from "../features/orders/orderSlice";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const STATUS_CLS = {
  Pending:    { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  Processing: { badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-400" },
  Printing:   { badge: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  Shipped:    { badge: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  Delivered:  { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Cancelled:  { badge: "bg-red-100 text-red-700",     dot: "bg-red-500" },
};
const PAY_CLS = {
  paid:     "bg-green-100 text-green-700",
  refunded: "bg-red-100 text-red-700",
  pending:  "bg-amber-100 text-amber-700",
};
const STATUS_ORDER = ["Pending", "Processing", "Printing", "Shipped", "Delivered"];

export default function OrderHistory() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((s) => s.orders);
  const [otpModal, setOtpModal] = useState(null);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const closeModal = () => { setOtpModal(null); setOtp(""); setOtpSent(false); };

  const handleRequestOTP = async (order) => {
    setOtpModal(order); setOtp(""); setOtpSent(false); setSendingOtp(true);
    const result = await dispatch(requestCancelOTP(order._id));
    setSendingOtp(false);
    if (!result.error) { setOtpSent(true); toast.success(result.payload?.message || "OTP sent to your email"); }
    else { toast.error(result.payload || "Failed to send OTP"); setOtpModal(null); }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setVerifying(true);
    const result = await dispatch(cancelOrder({ id: otpModal._id, otp: otp.trim() }));
    setVerifying(false);
    if (!result.error) { toast.success("Order cancelled successfully"); closeModal(); }
    else toast.error(result.payload || "Invalid OTP. Try again.");
  };

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading your orders...</div>;

  return (
    <div className="bg-gray-50 min-h-[80vh] px-4 md:px-12 py-8 pb-16">

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/55 z-[1000] flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full relative text-center shadow-2xl">
            <button onClick={closeModal} className="absolute top-3.5 right-4 bg-transparent border-none text-gray-400 text-xl font-bold cursor-pointer hover:text-gray-700">✕</button>
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="text-lg font-black text-gray-900 mb-1.5">Verify to Cancel Order</h2>
            <p className="text-gray-500 text-sm mb-5">Order <strong>#{otpModal._id.slice(-8).toUpperCase()}</strong> · ₹{otpModal.totalPrice?.toLocaleString()}</p>
            {sendingOtp ? (
              <p className="text-gray-500 text-sm bg-gray-50 rounded-lg px-4 py-3">📨 Sending OTP to your registered email…</p>
            ) : otpSent ? (
              <form onSubmit={handleConfirmCancel}>
                <p className="text-gray-500 text-sm bg-gray-50 rounded-lg px-4 py-3 mb-5 leading-relaxed">A 6-digit OTP has been sent to your registered email. Enter it below to confirm cancellation.</p>
                <div className="flex gap-2.5 justify-center mb-6">
                  {[0,1,2,3,4,5].map((i) => (
                    <input key={i} id={`otp-box-${i}`} type="text" inputMode="numeric" maxLength={1}
                      className="w-11 h-13 text-center text-2xl font-black border-2 border-gray-200 rounded-xl outline-none focus:border-red-700 text-gray-900 box-border"
                      style={{ height: "52px" }}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/, "");
                        const arr = otp.split(""); arr[i] = val;
                        setOtp(arr.join("").slice(0, 6));
                        if (val && i < 5) document.getElementById(`otp-box-${i + 1}`)?.focus();
                      }}
                      onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-box-${i - 1}`)?.focus(); }}
                    />
                  ))}
                </div>
                <div className="flex gap-2.5 justify-center mb-3">
                  <button type="button" onClick={() => handleRequestOTP(otpModal)} disabled={sendingOtp}
                    className="bg-white border-2 border-red-700 text-red-700 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-red-50 transition-colors">Resend OTP</button>
                  <button type="submit" disabled={verifying || otp.length < 6}
                    className="bg-red-700 border-none text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-red-800 transition-colors disabled:opacity-50">
                    {verifying ? "Verifying…" : "Confirm Cancel"}
                  </button>
                </div>
                <p className="text-gray-300 text-xs">⏱ OTP expires in 10 minutes</p>
              </form>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
        <Link to="/products" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors">Continue Shopping</Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center flex flex-col items-center gap-3">
          <span className="text-6xl">📦</span>
          <h2 className="text-xl font-black text-gray-900">No orders yet</h2>
          <p className="text-gray-400 text-sm">You haven't placed any orders. Start shopping!</p>
          <Link to="/products" className="bg-red-700 text-white px-7 py-3 rounded-lg font-bold text-sm mt-2 hover:bg-red-800 transition-colors">Browse Products</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const st = STATUS_CLS[order.status] || STATUS_CLS.Pending;
            const payCls = PAY_CLS[order.paymentStatus] || PAY_CLS.pending;
            const currentIdx = STATUS_ORDER.indexOf(order.status);
            return (
              <div key={order._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Card top */}
                <div className="flex flex-wrap justify-between items-start gap-3 px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.badge}`}>
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />{order.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${payCls}`}>
                      {order.paymentMethod === "razorpay" ? "💳" : "💵"} {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Pending"}
                    </span>
                    <span className="font-black text-red-700 text-base">₹{order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 py-3 flex flex-col gap-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 flex-wrap">
                      <img src={item.product?.image || "https://placehold.co/64x64/f5f5f5/999?text=Item"} alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl bg-gray-50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                        {item.uploadedImage && <a href={item.uploadedImage} target="_blank" rel="noreferrer" className="text-red-700 text-xs font-semibold">🎨 View Custom Design ↗</a>}
                      </div>
                      <p className="font-bold text-gray-900 text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Shipping */}
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-gray-500 text-xs">📍 {order.shippingAddress?.address}, {order.shippingAddress?.city} – {order.shippingAddress?.pincode}</p>
                  {order.shipment?.trackingId && (
                    <p className="text-gray-700 text-xs mt-1">🚚 {order.shipment.courierName} · AWB: <strong className="text-blue-700">{order.shipment.trackingId}</strong></p>
                  )}
                </div>

                {/* Cancel */}
                {["Pending", "Processing"].includes(order.status) && (
                  <div className="px-5 py-3 flex flex-wrap items-center gap-3 border-t border-gray-100 bg-red-50">
                    <button onClick={() => handleRequestOTP(order)}
                      className="bg-white border-2 border-red-700 text-red-700 px-4 py-1.5 rounded-lg font-bold text-xs cursor-pointer hover:bg-red-50 transition-colors whitespace-nowrap">
                      ✕ Cancel Order
                    </button>
                    <p className="text-gray-400 text-xs">Email OTP verification required · Printing / Shipped orders cannot be cancelled.</p>
                  </div>
                )}

                {/* Progress */}
                <div className="flex items-start px-5 py-4 overflow-x-auto gap-0">
                  {STATUS_ORDER.map((s2, i) => {
                    const isDone = i <= currentIdx && order.status !== "Cancelled";
                    return (
                      <div key={s2} className="flex flex-col items-center relative flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 shrink-0 transition-colors ${isDone ? "bg-red-700" : "bg-gray-200"}`}>
                          {isDone && <span className="text-white text-[9px] font-bold">✓</span>}
                        </div>
                        <p className={`text-[10px] font-semibold text-center whitespace-nowrap ${isDone ? "text-red-700" : "text-gray-300"}`}>{s2}</p>
                        {i < 4 && <div className={`absolute top-3 left-1/2 w-[calc(100%-24px)] h-0.5 translate-x-3 ${i < currentIdx && order.status !== "Cancelled" ? "bg-red-700" : "bg-gray-200"}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
