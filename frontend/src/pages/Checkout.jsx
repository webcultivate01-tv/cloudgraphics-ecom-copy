import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { placeOrder, resetOrderState } from "../features/orders/orderSlice";
import { createRazorpayOrder, verifyAndPlaceOrder, resetPayment } from "../features/payment/paymentSlice";
import { clearCart, selectCartTotal, setItemImage } from "../features/cart/cartSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
const ADDR_TYPES = ["Home", "Work", "Other"];
const STEPS = ["Shipping", "Designs", "Review", "Payment"];

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const total = useSelector(selectCartTotal);
  const { loading: orderLoading, success: orderSuccess, error: orderError } = useSelector((s) => s.orders);
  const { loading: payLoading, success: paySuccess, error: payError } = useSelector((s) => s.payment);
  const { user } = useSelector((s) => s.auth);

  const [shipping, setShipping] = useState({ fullName: "", phone: "", address: "", addressLine2: "", landmark: "", city: "", state: "", pincode: "", addressType: "Home" });
  const [note, setNote] = useState("");
  const [uploadingFor, setUploadingFor] = useState(null);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [upiId, setUpiId] = useState("");
  const loading = orderLoading || payLoading;

  useEffect(() => {
    if (orderSuccess || paySuccess) {
      toast.success("🎉 Order placed successfully!");
      dispatch(clearCart()); dispatch(resetOrderState()); dispatch(resetPayment());
      navigate("/orders");
    }
  }, [orderSuccess, paySuccess, dispatch, navigate]);

  useEffect(() => {
    if (orderError) toast.error(orderError);
    if (payError) toast.error(payError);
  }, [orderError, payError]);

  const missingImages = items.filter((i) => i.requiresCustomImage && !i.uploadedImage);

  const handleImageUpload = async (e, itemId) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingFor(itemId);
    try {
      const fd = new FormData(); fd.append("image", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      dispatch(setItemImage({ id: itemId, imageUrl: data.imageUrl }));
      toast.success("Image uploaded ✅");
    } catch { toast.error("Upload failed. Try again."); }
    finally { setUploadingFor(null); }
  };

  const buildOrderItems = () => items.map((item) => ({ product: item._id, quantity: item.quantity, uploadedImage: item.uploadedImage || "" }));

  const validateShipping = () => {
    if (!shipping.fullName.trim()) { toast.error("Enter your full name"); return false; }
    if (!shipping.phone.trim() || !/^\d{10}$/.test(shipping.phone.trim())) { toast.error("Enter a valid 10-digit phone number"); return false; }
    if (!shipping.address.trim()) { toast.error("Enter your address"); return false; }
    if (!shipping.city.trim()) { toast.error("Enter your city"); return false; }
    if (!shipping.state) { toast.error("Select your state"); return false; }
    if (!shipping.pincode.trim() || !/^\d{6}$/.test(shipping.pincode.trim())) { toast.error("Enter a valid 6-digit pincode"); return false; }
    return true;
  };

  const handleCOD = () => {
    if (missingImages.length > 0) { toast.error(`Upload image for: ${missingImages.map((i) => i.name).join(", ")}`); return; }
    dispatch(placeOrder({ items: buildOrderItems(), shippingAddress: shipping, customerNote: note, paymentMethod: "cod" }));
  };

  const handleRazorpay = async () => {
    if (missingImages.length > 0) { toast.error(`Upload image for: ${missingImages.map((i) => i.name).join(", ")}`); return; }
    const result = await dispatch(createRazorpayOrder(total));
    if (result.error) return;
    const { razorpayOrderId, amount, currency, keyId } = result.payload;
    const options = {
      key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID, amount, currency,
      name: "Cloud Graphics Amravati", description: "Custom Print Products", order_id: razorpayOrderId,
      prefill: { name: user?.name || shipping.fullName, email: user?.email || "", contact: shipping.phone, vpa: upiId.trim() || undefined },
      theme: { color: "#c41230" },
      handler: async (response) => {
        await dispatch(verifyAndPlaceOrder({ ...response, items: buildOrderItems(), shippingAddress: shipping, customerNote: note }));
      },
      modal: { ondismiss: () => toast.info("Payment cancelled. You can try again.") },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => toast.error(`Payment failed: ${resp.error.description}`));
    rzp.open();
  };

  const handlePayNow = () => paymentMethod === "cod" ? handleCOD() : handleRazorpay();

  if (items.length === 0) return (
    <div className="text-center py-20 bg-white">
      <p className="text-gray-500 mb-4">Your cart is empty.</p>
      <Link to="/products" className="bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-red-800 transition-colors">Shop Now</Link>
    </div>
  );

  const inputCls = "w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-red-700 transition-colors box-border font-[inherit]";

  return (
    <div className="bg-white max-w-5xl mx-auto px-4 md:px-10 py-8 pb-16">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

      {/* Step bar */}
      <div className="flex items-center mb-8 flex-wrap gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${step >= i + 1 ? "bg-red-700 text-white" : "bg-gray-200 text-gray-400"}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap hidden sm:inline ${step >= i + 1 ? "text-red-700 font-bold" : "text-gray-400"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`w-8 md:w-12 h-0.5 mx-1 ${step > i + 1 ? "bg-red-700" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-7 items-start">
        <div className="flex-1 min-w-0">

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">📦 Delivery Address</h2>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Address Type</label>
                <div className="flex gap-2 flex-wrap">
                  {ADDR_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setShipping({ ...shipping, addressType: t })}
                      className={`px-4 py-2 border-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${shipping.addressType === t ? "border-red-700 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}`}>
                      {t === "Home" ? "🏠" : t === "Work" ? "🏢" : "📍"} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label><input className={inputCls} placeholder="Your full name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number *</label><input className={inputCls} placeholder="10-digit mobile number" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} maxLength={10} /></div>
              </div>
              <div className="mb-4"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Address Line 1 *</label><input className={inputCls} placeholder="House no, building, street" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} /></div>
              <div className="mb-4"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Address Line 2 <span className="font-normal text-gray-400">(optional)</span></label><input className={inputCls} placeholder="e.g. Opposite Bus Stand" value={shipping.addressLine2} onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} /></div>
              <div className="mb-4"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Landmark <span className="font-normal text-gray-400">(optional)</span></label><input className={inputCls} placeholder="e.g. Near City Mall" value={shipping.landmark} onChange={(e) => setShipping({ ...shipping, landmark: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">City / Town *</label><input className={inputCls} placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Pincode *</label><input className={inputCls} placeholder="6-digit pincode" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} maxLength={6} /></div>
              </div>
              <div className="mb-4"><label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
                <select className={inputCls} value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })}>
                  <option value="">— Select State —</option>
                  {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="mb-5"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Order Note <span className="font-normal text-gray-400">(optional)</span></label><textarea className={`${inputCls} h-16 resize-y`} placeholder="Special instructions..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
              <button onClick={() => { if (validateShipping()) setStep(2); }} className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg font-bold text-sm border-none cursor-pointer transition-colors">Continue to Upload Designs →</button>
            </div>
          )}

          {/* Step 2: Images */}
          {step === 2 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">🎨 Upload Custom Designs</h2>
              {items.map((item) => (
                <div key={item._id} className="flex gap-3 py-4 border-b border-gray-100 items-start">
                  <img src={item.image || "https://placehold.co/60x60/f5f5f5/999"} alt={item.name} className="w-14 h-14 object-cover rounded-lg bg-gray-50 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      {item.name}
                      {item.requiresCustomImage && <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded">Required *</span>}
                    </p>
                    {item.requiresCustomImage || item.allowCustomImage ? (
                      <div className="flex flex-col gap-2">
                        <input type="file" accept="image/*" id={`upload-${item._id}`} className="hidden" onChange={(e) => handleImageUpload(e, item._id)} />
                        <label htmlFor={`upload-${item._id}`} className="inline-block bg-gray-100 border border-gray-200 rounded-lg px-3.5 py-1.5 cursor-pointer text-xs font-semibold text-gray-700 w-fit hover:bg-gray-200 transition-colors">
                          {uploadingFor === item._id ? "Uploading..." : item.uploadedImage ? "Change Image" : "📁 Choose Image"}
                        </label>
                        {item.uploadedImage && (
                          <div className="flex items-center gap-2">
                            <img src={item.uploadedImage} alt="preview" className="w-12 h-12 object-cover rounded" />
                            <span className="text-green-700 text-xs font-semibold">✅ Uploaded</span>
                          </div>
                        )}
                        {item.requiresCustomImage && !item.uploadedImage && <p className="text-orange-600 text-xs font-semibold">⚠️ This product requires a custom image.</p>}
                      </div>
                    ) : <p className="text-gray-400 text-xs">No custom image needed</p>}
                  </div>
                </div>
              ))}
              {missingImages.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mt-3">
                  🚫 Upload images for: <strong>{missingImages.map((i) => i.name).join(", ")}</strong>
                </div>
              )}
              <div className="flex gap-3 justify-between mt-5">
                <button onClick={() => setStep(1)} className="bg-white border border-red-700 text-red-700 px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer hover:bg-red-50 transition-colors">← Back</button>
                <button onClick={() => { if (missingImages.length > 0) { toast.error("Upload required images first"); return; } setStep(3); }}
                  className={`bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer transition-colors ${missingImages.length > 0 ? "opacity-50" : ""}`}>
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">✅ Review Your Order</h2>
              <div className="mb-4 pb-4 border-b border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Delivering To</h3>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block">{shipping.addressType === "Home" ? "🏠" : shipping.addressType === "Work" ? "🏢" : "📍"} {shipping.addressType}</span>
                  <p className="font-bold text-gray-900 text-sm">{shipping.fullName}</p>
                  <p className="text-gray-500 text-xs mt-0.5">📞 {shipping.phone}</p>
                  <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{shipping.address}{shipping.addressLine2 ? ", " + shipping.addressLine2 : ""}{shipping.landmark ? `, Near: ${shipping.landmark}` : ""}<br />{shipping.city}, {shipping.state} – {shipping.pincode}</p>
                </div>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Items ({items.length})</h3>
                {items.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{item.name} × {item.quantity}</span>
                    <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {note && <div className="mb-4 pb-4 border-b border-gray-100"><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order Note</h3><p className="text-gray-500 text-sm">{note}</p></div>}
              <div className="flex gap-3 justify-between mt-5">
                <button onClick={() => setStep(2)} className="bg-white border border-red-700 text-red-700 px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer hover:bg-red-50 transition-colors">← Back</button>
                <button onClick={() => setStep(4)} className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer transition-colors">Choose Payment →</button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">💳 Choose Payment Method</h2>
              <div className="flex flex-col gap-3 mb-4">
                {[
                  { value: "razorpay", icon: "💳", name: "Pay Online (Razorpay)", desc: "UPI · Cards · Net Banking · Wallets — Instant & Secure", activeCls: "border-red-700 bg-red-50" },
                  { value: "cod", icon: "💵", name: "Cash on Delivery (COD)", desc: "Pay when your order arrives · Available for all areas", activeCls: "border-green-600 bg-green-50" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-4 border-2 rounded-xl p-4 cursor-pointer transition-colors ${paymentMethod === opt.value ? opt.activeCls : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} className="hidden" />
                    <span className="text-3xl shrink-0">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm mb-0.5">{opt.name}</p>
                      <p className="text-gray-400 text-xs">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${paymentMethod === opt.value ? (opt.value === "razorpay" ? "border-[6px] border-red-700 bg-white" : "border-[6px] border-green-600 bg-white") : "border-gray-300"}`} />
                  </label>
                ))}
              </div>
              {paymentMethod === "razorpay" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-700 font-bold text-sm mb-2">⚡ Pay instantly with UPI ID <span className="font-normal text-gray-500">(optional)</span></p>
                  <div className="flex gap-2 mb-2">
                    <input className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm bg-white outline-none" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    {upiId.trim() && <button type="button" onClick={() => setUpiId("")} className="bg-transparent border-none text-red-700 font-bold cursor-pointer px-2">✕</button>}
                  </div>
                  <p className="text-red-600 text-xs">🔒 Powered by Razorpay — 100% secure & encrypted.</p>
                </div>
              )}
              {paymentMethod === "cod" && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm mb-4">📦 Your order will be processed and delivered to you. Pay in cash at the time of delivery.</div>
              )}
              <div className="flex justify-between items-center py-3.5 border-t border-gray-100 mb-2 font-semibold text-gray-900">
                <span>Total Amount</span>
                <span className="text-red-700 font-black text-xl">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex gap-3 justify-between mt-4">
                <button onClick={() => setStep(3)} className="bg-white border border-red-700 text-red-700 px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer hover:bg-red-50 transition-colors">← Back</button>
                <button onClick={handlePayNow} disabled={loading}
                  className={`bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer transition-colors ${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
                  {loading ? "Processing..." : paymentMethod === "razorpay" ? `Pay ₹${total.toLocaleString()} →` : "Place COD Order →"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-64 bg-gray-50 rounded-2xl p-5 lg:sticky lg:top-28 shrink-0">
          <h3 className="font-black text-gray-900 text-sm mb-4">Order Summary</h3>
          {items.map((item) => (
            <div key={item._id} className="flex justify-between mb-2">
              <span className="text-gray-500 text-xs">{item.name} × {item.quantity}</span>
              <span className="text-gray-900 font-semibold text-xs">₹{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="h-px bg-gray-200 my-3" />
          <div className="flex justify-between mb-2">
            <span className="font-black text-gray-900 text-sm">Total</span>
            <span className="text-red-700 font-black text-base">₹{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-xs">Shipping</span>
            <span className="text-green-700 font-bold text-xs">FREE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-xs">Payment</span>
            <span className={`font-bold text-xs ${paymentMethod === "razorpay" ? "text-red-700" : "text-green-700"}`}>{paymentMethod === "razorpay" ? "💳 Online" : "💵 COD"}</span>
          </div>
          {step >= 2 && shipping.city && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Delivering to</p>
              <p className="text-gray-800 text-xs font-semibold">{shipping.fullName}</p>
              <p className="text-gray-500 text-xs">{shipping.city}{shipping.state ? ", " + shipping.state : ""} {shipping.pincode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
