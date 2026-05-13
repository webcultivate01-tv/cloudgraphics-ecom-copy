import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { fetchActiveEvents } from "../features/events/eventSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import { fetchApprovedReviews, submitReview } from "../features/review/reviewSlice";
import ProductCard from "../components/ProductCard";
import HeroSlider from "../components/HeroSlider";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const CAT_COLORS = ["bg-orange-50","bg-green-50","bg-blue-50","bg-pink-50","bg-purple-50","bg-cyan-50","bg-yellow-50","bg-gray-50"];
const REVIEW_EMPTY = { name: "", email: "", rating: 0, message: "" };
const FEATURES = [
  { icon: "🚚", title: "Fast Delivery", desc: "Quick delivery across Amravati & Maharashtra" },
  { icon: "🎨", title: "100% Custom Designs", desc: "Upload your photo or design — we print it" },
  { icon: "⭐", title: "Premium Quality", desc: "Durable prints that last for years" },
  { icon: "💰", title: "Best Prices", desc: "Affordable prices with bulk discounts" },
];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 mt-1">
      {[1,2,3,4,5].map((star) => (
        <button key={star} type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`bg-transparent border-none cursor-pointer p-0.5 text-3xl leading-none transition-transform duration-100 ${star <= (hovered || value) ? "text-amber-400 scale-110" : "text-gray-300"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <span className="inline-flex gap-px">
      {[1,2,3,4,5].map((star) => (
        <span key={star} className={`text-base ${star <= rating ? "text-amber-400" : "text-gray-300"}`}>★</span>
      ))}
    </span>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((s) => s.products);
  const { events } = useSelector((s) => s.events);
  const { items: categories } = useSelector((s) => s.categories);
  const { approvedReviews, loading: reviewLoading } = useSelector((s) => s.review);

  const [reviewForm, setReviewForm] = useState(REVIEW_EMPTY);
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts()); dispatch(fetchActiveEvents());
    dispatch(fetchCategories()); dispatch(fetchApprovedReviews());
  }, [dispatch]);

  const featured = products.slice(0, 8);
  const customize = products.filter((p) => p.requiresCustomImage).slice(0, 4);

  const validateReview = () => {
    const e = {};
    if (!reviewForm.name.trim()) e.name = "Name is required";
    if (!reviewForm.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewForm.email)) e.email = "Enter a valid email";
    if (!reviewForm.rating) e.rating = "Please select a rating";
    if (!reviewForm.message.trim()) e.message = "Review message is required";
    else if (reviewForm.message.trim().length < 10) e.message = "At least 10 characters required";
    return e;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const errs = validateReview();
    if (Object.keys(errs).length) { setReviewErrors(errs); return; }
    const result = await dispatch(submitReview(reviewForm));
    if (!result.error) {
      setReviewSubmitted(true); setReviewForm(REVIEW_EMPTY); setReviewErrors({}); setShowReviewForm(false);
      toast.success("Review submitted! It will appear after approval.");
    } else { toast.error(result.payload || "Failed to submit. Please try again."); }
  };

  const inputCls = (err) => `w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none font-[inherit] transition-colors ${err ? "border-red-600 bg-red-50" : "border-gray-200 bg-white focus:border-red-600"}`;

  return (
    <div className="bg-white">
      <HeroSlider />

      {/* Events Banner */}
      {events.length > 0 && (
        <div className="bg-red-50 border-b border-pink-100">
          <div className="max-w-7xl mx-auto flex overflow-x-auto">
            {events.slice(0, 3).map((ev) => (
              <div key={ev._id} className="flex items-center gap-2 px-6 py-2.5 border-r border-pink-100 whitespace-nowrap">
                <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">{ev.badge}</span>
                <span className="text-gray-800 text-xs font-medium">{ev.title}</span>
                {ev.link && <Link to={ev.link} className="text-red-700 text-xs font-semibold">View →</Link>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 py-10 md:py-12">
        <div className="flex justify-between items-center mb-7">
          <h2 className="text-2xl font-black text-gray-900 -tracking-wide">Shop by Category</h2>
          <Link to="/products" className="text-red-700 font-bold text-sm">View All →</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {categories.map((cat, i) => (
            <Link key={cat._id} to={`/products?category=${cat.name}`}
              className={`flex flex-col items-center gap-2 py-5 px-2 rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${CAT_COLORS[i % CAT_COLORS.length]}`}>
              <span className="text-3xl">{cat.icon || "🏷️"}</span>
              <p className="text-gray-900 text-xs font-bold text-center">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 px-4 md:px-12 py-10 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-7">
            <h2 className="text-2xl font-black text-gray-900 -tracking-wide">Featured Products</h2>
            <Link to="/products" className="text-red-700 font-bold text-sm">View All →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No products yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Design Your Own */}
      {customize.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-12 py-10 md:py-12">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-black text-gray-900 -tracking-wide">🎨 Design Your Own</h2>
            <Link to="/products?type=customize" className="text-red-700 font-bold text-sm">View All →</Link>
          </div>
          <p className="text-gray-500 text-sm mb-6">Upload your photo and get it printed on premium products</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {customize.map((p) => <ProductCard key={p._id} product={p} badge="Customize" />)}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-gray-50 px-4 md:px-12 py-12 md:py-16">
        <h2 className="text-2xl font-black text-gray-900 text-center mb-10 -tracking-wide">How It Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { step: "01", title: "Choose Product", desc: "Pick from our range of printable products" },
            { step: "02", title: "Upload Design", desc: "Upload your photo, logo or custom artwork" },
            { step: "03", title: "Place Order", desc: "Review and confirm your personalized order" },
            { step: "04", title: "Receive Delivery", desc: "Get your custom product delivered fast" },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-red-700 text-white text-lg font-black flex items-center justify-center mx-auto mb-4">{item.step}</div>
              <h3 className="text-gray-900 font-bold text-sm mb-2">{item.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="bg-white border-t border-gray-100 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-12">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 -tracking-wide">⭐ Customer Reviews</h2>
              <p className="text-gray-500 text-sm mt-1">What our customers say about us</p>
            </div>
            <button onClick={() => { setShowReviewForm((v) => !v); setReviewSubmitted(false); }}
              className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold cursor-pointer border-none transition-colors whitespace-nowrap">
              {showReviewForm ? "✕ Cancel" : "✍️ Write a Review"}
            </button>
          </div>

          {showReviewForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8 mb-9">
              <h3 className="text-base font-black text-gray-900 mb-5">Share Your Experience</h3>
              {reviewSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 text-green-700 font-semibold text-sm">
                  ✅ Thank you! Your review has been submitted and will be visible after approval.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} noValidate className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-600">Your Name *</label>
                      <input className={inputCls(reviewErrors.name)} placeholder="John Doe" value={reviewForm.name}
                        onChange={(e) => { setReviewForm({ ...reviewForm, name: e.target.value }); setReviewErrors({ ...reviewErrors, name: "" }); }} />
                      {reviewErrors.name && <span className="text-red-600 text-xs font-semibold">{reviewErrors.name}</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-600">Email Address *</label>
                      <input type="email" className={inputCls(reviewErrors.email)} placeholder="you@example.com" value={reviewForm.email}
                        onChange={(e) => { setReviewForm({ ...reviewForm, email: e.target.value }); setReviewErrors({ ...reviewErrors, email: "" }); }} />
                      {reviewErrors.email && <span className="text-red-600 text-xs font-semibold">{reviewErrors.email}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">Your Rating *</label>
                    <StarPicker value={reviewForm.rating} onChange={(v) => { setReviewForm({ ...reviewForm, rating: v }); setReviewErrors({ ...reviewErrors, rating: "" }); }} />
                    {reviewErrors.rating && <span className="text-red-600 text-xs font-semibold">{reviewErrors.rating}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">Your Review *</label>
                    <textarea rows={4} className={`${inputCls(reviewErrors.message)} resize-y min-h-24`}
                      placeholder="Tell us about your experience…" value={reviewForm.message}
                      onChange={(e) => { setReviewForm({ ...reviewForm, message: e.target.value }); setReviewErrors({ ...reviewErrors, message: "" }); }} />
                    {reviewErrors.message && <span className="text-red-600 text-xs font-semibold">{reviewErrors.message}</span>}
                  </div>
                  <button type="submit" disabled={reviewLoading}
                    className={`w-fit px-6 py-3 rounded-lg text-sm font-bold text-white border-none cursor-pointer transition-colors ${reviewLoading ? "bg-red-300 cursor-not-allowed" : "bg-red-700 hover:bg-red-800"}`}>
                    {reviewLoading ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          )}

          {reviewLoading && approvedReviews.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : approvedReviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No reviews yet. Be the first to share your experience!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {approvedReviews.slice(0, 6).map((review) => (
                <div key={review._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-base shrink-0">
                      {review.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm mb-0.5">{review.name}</p>
                      <StarDisplay rating={review.rating} />
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed italic flex-1">"{review.message}"</p>
                  <p className="text-gray-300 text-xs">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Strip */}
      <div className="bg-[#1a1a1a] grid grid-cols-2 md:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div key={f.title} className={`flex items-start gap-3 px-6 py-6 ${i < 3 ? "border-r border-gray-800" : ""}`}>
            <span className="text-3xl shrink-0">{f.icon}</span>
            <div>
              <p className="text-white font-bold text-sm mb-1">{f.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
