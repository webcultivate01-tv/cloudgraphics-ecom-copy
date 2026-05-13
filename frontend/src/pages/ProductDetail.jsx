import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById, clearSelectedProduct } from "../features/products/productSlice";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite, selectFavoriteIds } from "../features/favorites/favoritesSlice";
import { toast } from "react-toastify";

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading } = useSelector((s) => s.products);
  const favoriteIds = useSelector(selectFavoriteIds);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { dispatch(fetchProductById(id)); return () => dispatch(clearSelectedProduct()); }, [dispatch, id]);
  useEffect(() => { setActiveIdx(0); }, [product?._id]);

  const images = product ? (product.images?.length ? product.images : product.image ? [product.image] : []) : [];

  const advance = useCallback(() => { if (images.length > 1) setActiveIdx((i) => (i + 1) % images.length); }, [images.length]);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(advance, 2000);
    return () => clearInterval(t);
  }, [advance, images.length]);

  if (loading || !product) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-red-700 rounded-full animate-spin" />
      <p className="text-gray-400 mt-4 text-sm">Loading product...</p>
    </div>
  );

  const isFav = favoriteIds.has(product._id);
  const hasDiscount = product.originalPrice > 0 && product.originalPrice > product.price;
  const discountPct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const hasSpecs = product.specifications?.length > 0;
  const TABS = [{ key: "desc", label: "Description" }, ...(hasSpecs ? [{ key: "specs", label: "Specifications" }] : []), { key: "delivery", label: "Delivery & Returns" }];
  const currentImage = images[activeIdx] || "https://placehold.co/500x500/f5f5f5/999?text=Product";

  return (
    <div className="bg-white max-w-7xl mx-auto px-4 md:px-12 py-6 md:py-8 pb-16">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 mb-6 flex flex-wrap gap-1">
        <Link to="/" className="hover:text-red-700">Home</Link> /
        <Link to="/products" className="hover:text-red-700"> Products</Link> /
        <Link to={`/products?category=${product.category}`} className="hover:text-red-700"> {product.category}</Link> /
        <span className="text-gray-700"> {product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-14 mb-12">
        {/* Image Gallery */}
        <div className="w-full md:w-[440px] shrink-0">
          <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square">
            <img src={currentImage} alt={product.name} className="w-full h-full object-cover transition-opacity duration-300" />
            {product.requiresCustomImage && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-700/85 text-white text-center py-3 font-bold text-sm">🎨 Upload Your Design</div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded">{discountPct}% OFF</div>
            )}
            {images.length > 1 && (
              <>
                <button className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/45 text-white border-none rounded-full w-9 h-9 flex items-center justify-center text-xl cursor-pointer z-10"
                  onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}>‹</button>
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/45 text-white border-none rounded-full w-9 h-9 flex items-center justify-center text-xl cursor-pointer z-10"
                  onClick={() => setActiveIdx((i) => (i + 1) % images.length)}>›</button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => <span key={i} onClick={() => setActiveIdx(i)} className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === activeIdx ? "bg-white" : "bg-white/50"}`} />)}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, i) => (
                <img key={i} src={img} alt={`view-${i}`} onClick={() => setActiveIdx(i)}
                  className={`w-16 h-16 object-cover rounded-lg cursor-pointer transition-all ${i === activeIdx ? "border-2 border-red-700" : "border-2 border-gray-200"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">{product.category}</span>
            {product.brand && <span className="text-red-700 text-sm font-semibold">by {product.brand}</span>}
            {product.sku && <span className="text-gray-400 text-xs">SKU: {product.sku}</span>}
          </div>

          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight flex-1">{product.name}</h1>
            <button onClick={() => { dispatch(toggleFavorite(product)); toast.success(isFav ? "Removed from favourites" : "Added to favourites ❤️"); }}
              className="bg-transparent border-none cursor-pointer p-1 shrink-0 mt-1 text-2xl">
              {isFav ? "❤️" : "🤍"}
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-3 my-4">
            <span className="text-red-700 text-3xl font-black">₹{product.price.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-gray-400 text-lg line-through">₹{product.originalPrice.toLocaleString()}</span>
                <span className="bg-green-50 text-green-700 font-bold text-xs px-2.5 py-1 rounded">{discountPct}% off</span>
              </>
            )}
          </div>

          {product.requiresCustomImage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 mb-4">
              <span className="text-2xl shrink-0">🎨</span>
              <div>
                <p className="font-bold text-red-700 text-sm mb-1">Custom Design Required</p>
                <p className="text-gray-600 text-xs">You must upload your custom image or design during checkout.</p>
              </div>
            </div>
          )}
          {product.allowCustomImage && !product.requiresCustomImage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 mb-4">
              <span className="text-2xl shrink-0">✏️</span>
              <div>
                <p className="font-bold text-green-700 text-sm mb-1">Custom Design Optional</p>
                <p className="text-gray-600 text-xs">You can upload a custom image during checkout, or proceed without one.</p>
              </div>
            </div>
          )}

          <p className={`text-sm font-semibold mb-4 ${product.stock > 0 ? "text-green-700" : "text-red-700"}`}>
            {product.stock > 0 ? `✅ In Stock (${product.stock} available)` : "❌ Out of Stock"}
          </p>

          {product.highlights?.length > 0 && (
            <ul className="list-none p-0 mb-5 flex flex-col gap-1.5">
              {product.highlights.map((h, i) => (
                <li key={i} className="text-gray-700 text-sm flex items-center gap-2">
                  <span className="text-green-700 font-black text-sm shrink-0">✓</span> {h}
                </li>
              ))}
            </ul>
          )}

          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-600 font-semibold text-sm">Quantity:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="bg-gray-50 border-none w-9 h-9 text-xl cursor-pointer text-gray-700 hover:bg-gray-100">−</button>
                <span className="px-5 font-bold text-base">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="bg-gray-50 border-none w-9 h-9 text-xl cursor-pointer text-gray-700 hover:bg-gray-100">+</button>
              </div>
            </div>
          )}

          <div className="flex gap-3 mb-5">
            <button onClick={() => { dispatch(addToCart({ ...product, quantity: qty })); toast.success(`${product.name} added to cart!`); }}
              disabled={product.stock === 0}
              className="flex-1 py-3.5 border-2 border-red-700 text-red-700 bg-white rounded-lg font-bold text-sm cursor-pointer hover:bg-red-50 transition-colors disabled:opacity-50">
              Add to Cart
            </button>
            <button onClick={() => { dispatch(addToCart({ ...product, quantity: qty })); navigate("/cart"); }}
              disabled={product.stock === 0}
              className="flex-1 py-3.5 border-2 border-red-700 bg-red-700 text-white rounded-lg font-bold text-sm cursor-pointer hover:bg-red-800 transition-colors disabled:opacity-50">
              Buy Now
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {["🖨️ Premium printing", "📦 Secure packaging", "🚚 Fast delivery", "↩️ Easy returns"].map((b) => (
              <div key={b} className="bg-gray-50 px-3 py-2.5 rounded-lg text-xs text-gray-600">{b}</div>
            ))}
          </div>

          {product.weight && <p className="text-gray-500 text-xs">⚖️ Weight: <strong>{product.weight}</strong></p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex border-b-2 border-gray-200 mb-6 gap-0">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-6 py-2.5 border-none bg-transparent font-semibold text-sm cursor-pointer border-b-2 -mb-0.5 transition-colors ${tab === key ? "text-red-700 border-red-700" : "text-gray-500 border-transparent hover:text-gray-800"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="max-w-2xl">
          {tab === "desc" && <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>}
          {tab === "specs" && (
            <table className="w-full border-collapse rounded-xl overflow-hidden border border-gray-200">
              <tbody>
                {product.specifications.map((sp, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-2.5 text-gray-600 font-bold text-sm w-48 border-r border-gray-200">{sp.key}</td>
                    <td className="px-4 py-2.5 text-gray-700 text-sm">{sp.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "delivery" && (
            <div className="text-gray-600 text-sm leading-relaxed flex flex-col gap-3">
              <p>🚚 <strong>Delivery:</strong> 3–5 business days in Amravati. 5–7 days for other Maharashtra locations.</p>
              <p>↩️ <strong>Returns:</strong> {product.returnPolicy || "Custom printed products are non-returnable unless defective. Standard products can be returned within 7 days."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
