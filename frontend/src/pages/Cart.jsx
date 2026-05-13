import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateQuantity, selectCartTotal } from "../features/cart/cartSlice";
import { useNavigate, Link } from "react-router-dom";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const total = useSelector(selectCartTotal);
  const { user } = useSelector((s) => s.auth);

  if (items.length === 0) return (
    <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center gap-3 px-6 py-16">
      <span className="text-6xl">🛒</span>
      <h2 className="text-2xl font-black text-gray-900">Your cart is empty</h2>
      <p className="text-gray-400 text-sm">Looks like you haven't added any products yet.</p>
      <Link to="/products" className="bg-red-700 text-white px-8 py-3 rounded-lg font-bold mt-3 hover:bg-red-800 transition-colors">Start Shopping</Link>
    </div>
  );

  return (
    <div className="bg-white max-w-5xl mx-auto px-4 md:px-10 py-8 pb-16">
      <div className="flex items-center gap-3 mb-7 pb-4 border-b-2 border-gray-200">
        <h1 className="text-2xl font-black text-gray-900">Shopping Cart</h1>
        <span className="bg-gray-100 text-gray-500 text-sm font-semibold px-3 py-0.5 rounded-full">{items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Items */}
        <div className="flex-1 min-w-0">
          <div className="hidden md:flex items-center gap-4 pb-2.5 border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            <span className="flex-[2]">Product</span>
            <span className="w-28 text-center">Quantity</span>
            <span className="w-24 text-right">Total</span>
            <span className="w-14" />
          </div>
          {items.map((item) => (
            <div key={item._id} className="flex flex-wrap md:flex-nowrap items-center gap-4 py-4 border-b border-gray-100">
              <div className="flex gap-3 flex-[2] min-w-0">
                <img src={item.image || "https://placehold.co/80x80/f5f5f5/999?text=Item"} alt={item.name}
                  className="w-20 h-20 object-cover rounded-xl bg-gray-50 cursor-pointer shrink-0"
                  onClick={() => navigate(`/products/${item._id}`)} />
                <div className="min-w-0">
                  <p className="text-gray-900 font-bold text-sm cursor-pointer mb-0.5 truncate" onClick={() => navigate(`/products/${item._id}`)}>{item.name}</p>
                  <p className="text-gray-400 text-xs mb-1">{item.category}</p>
                  <p className="text-gray-500 text-xs">₹{item.price.toLocaleString()} each</p>
                  {item.requiresCustomImage && !item.uploadedImage && <p className="text-orange-600 text-xs font-semibold mt-1">⚠️ Custom image required at checkout</p>}
                  {item.uploadedImage && <p className="text-green-700 text-xs font-semibold mt-1">✅ Custom image ready</p>}
                </div>
              </div>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-28">
                <button className="bg-gray-50 border-none w-9 h-9 text-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                  onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}>−</button>
                <span className="flex-1 text-center font-bold text-sm">{item.quantity}</span>
                <button className="bg-gray-50 border-none w-9 h-9 text-lg cursor-pointer text-gray-700 hover:bg-gray-100"
                  onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}>+</button>
              </div>
              <p className="w-24 text-right font-bold text-gray-900 text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
              <button className="w-14 text-right text-gray-300 hover:text-red-600 bg-transparent border-none text-lg cursor-pointer transition-colors"
                onClick={() => dispatch(removeFromCart(item._id))}>✕</button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="w-full lg:w-72 bg-gray-50 rounded-2xl p-6 lg:sticky lg:top-28 shrink-0">
          <h2 className="text-base font-black text-gray-900 mb-5">Order Summary</h2>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm">Subtotal</span>
            <span className="text-gray-900 font-semibold text-sm">₹{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm">Shipping</span>
            <span className="text-green-700 font-semibold text-sm">FREE</span>
          </div>
          <div className="h-px bg-gray-200 my-4" />
          <div className="flex justify-between items-center">
            <span className="font-black text-gray-900">Total</span>
            <span className="text-red-700 font-black text-xl">₹{total.toLocaleString()}</span>
          </div>
          <button onClick={() => user ? navigate("/checkout") : navigate("/login")}
            className="w-full mt-5 py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-sm cursor-pointer border-none transition-colors">
            {user ? "Proceed to Checkout" : "Login to Checkout"}
          </button>
          <Link to="/products" className="block text-center text-red-700 font-semibold text-sm mt-3 hover:underline">← Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
